import http from 'http';
import { createApp } from '../app.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { seedDatabase } from './seed.js';

async function runTests() {
  console.log('🧪 Starting AI Revenue Recovery backend API verification suite...\n');

  await connectDatabase();
  await seedDatabase(true);

  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(5099, () => {
      resolve();
    });
  });

  const baseUrl = 'http://localhost:5099';

  async function request(path: string, options: RequestInit = {}) {
    const res = await fetch(`${baseUrl}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
    const json = (await res.json()) as any;
    return { status: res.status, data: json };
  }

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: unknown) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`, detail || '');
      failed++;
    }
  }

  try {
    // 1. Health
    const health = await request('/health');
    assert(health.status === 200 && health.data.status === 'ok', '1. GET /health');

    // 2. Dashboard KPIs, Trend & Funnel
    const dashboard = await request('/api/v1/recovery/dashboard');
    assert(
      dashboard.status === 200 &&
        dashboard.data.success === true &&
        dashboard.data.data.kpis &&
        dashboard.data.data.kpis.revenueAtRisk > 0 &&
        Array.isArray(dashboard.data.data.trend) &&
        Array.isArray(dashboard.data.data.funnel) &&
        dashboard.data.data.recentCases.length > 0,
      '2. GET /api/v1/recovery/dashboard (KPIs, Funnel, Trend)'
    );

    // 3. List Cases (Pagination & Filters)
    const cases = await request('/api/v1/recovery-cases?page=1&pageSize=10');
    assert(
      cases.status === 200 &&
        cases.data.success === true &&
        cases.data.data.items.length === 10 &&
        cases.data.data.total >= 30 &&
        cases.data.meta.stats.all >= 30,
      '3. GET /api/v1/recovery-cases with pagination and stats'
    );

    // 4. Case Detail (Check exact shape matching frontend)
    const singleCase = await request('/api/v1/recovery-cases/RC-1024');
    assert(
      singleCase.status === 200 &&
        singleCase.data.success === true &&
        singleCase.data.data.id === 'RC-1024' &&
        singleCase.data.data.history &&
        singleCase.data.data.guardrails &&
        Array.isArray(singleCase.data.data.timeline) &&
        Array.isArray(singleCase.data.data.auditLog),
      '4. GET /api/v1/recovery-cases/RC-1024 (Full frontend drop-in shape)'
    );

    // 5. Ingest Revenue Event
    const ingest = await request('/api/v1/revenue-events', {
      method: 'POST',
      body: JSON.stringify({
        paymentId: 'PAY-TEST-999',
        customerName: 'Test Corporation',
        amount: 14500,
        paymentMethod: 'Visa •••• 9999',
        failureReason: 'Temporary gateway timeout on capture',
      }),
    });
    assert(
      ingest.status === 201 &&
        ingest.data.success === true &&
        ingest.data.data.recoveryCase.amountAtRisk === 14500,
      '5. POST /api/v1/revenue-events (Ingest event & spawn RecoveryCase)'
    );
    const newCaseId = ingest.data.data.recoveryCase.caseId;

    // 6. Process Recovery Case (Lifecycle execution)
    const processResult = await request(`/api/v1/recovery-cases/${newCaseId}/process`, {
      method: 'POST',
    });
    assert(
      processResult.status === 200 &&
        processResult.data.success === true &&
        processResult.data.data.timeline.length >= 4 &&
        processResult.data.data.aiConfidence > 0 &&
        processResult.data.data.guardrails.retryUsed >= 0,
      '6. POST /api/v1/recovery-cases/:id/process (AI -> Policy -> Action -> Updates)'
    );

    // 7. Case Audit Logs
    const logs = await request(`/api/v1/recovery-cases/${newCaseId}/logs`);
    assert(
      logs.status === 200 &&
        logs.data.success === true &&
        logs.data.data.length >= 2,
      '7. GET /api/v1/recovery-cases/:id/logs (Audit Trail)'
    );

    // 8. Demo Batch Simulation (20 cases)
    const batch = await request('/api/v1/demo/run-batch', {
      method: 'POST',
      body: JSON.stringify({ batchSize: 20 }),
    });
    assert(
      batch.status === 200 &&
        batch.data.success === true &&
        batch.data.data.processedCount === 20 &&
        batch.data.data.atRisk > 0 &&
        batch.data.data.rate >= 0,
      '8. POST /api/v1/demo/run-batch (Batch process 20 synthetic cases)'
    );

    // 9. Activity Feed
    const activity = await request('/api/v1/activity');
    assert(
      activity.status === 200 &&
        activity.data.success === true &&
        activity.data.data.length > 0,
      '9. GET /api/v1/activity (Live decision/action feed)'
    );

    // 10. Settings Policies
    const settings = await request('/api/v1/settings/policies');
    assert(
      settings.status === 200 &&
        settings.data.success === true &&
        settings.data.data.maxPaymentRetries === 3,
      '10. GET /api/v1/settings/policies'
    );

    const updatePolicy = await request('/api/v1/settings/policies', {
      method: 'PUT',
      body: JSON.stringify({ maxPaymentRetries: 4, highValueThreshold: 30000 }),
    });
    assert(
      updatePolicy.status === 200 &&
        updatePolicy.data.success === true &&
        updatePolicy.data.data.maxPaymentRetries === 4 &&
        updatePolicy.data.data.highValueThreshold === 30000,
      '11. PUT /api/v1/settings/policies (Update policy thresholds)'
    );

    // 12. Swagger UI & OpenAPI Specification Endpoints
    const swaggerJson = await request('/api-docs/json');
    assert(
      swaggerJson.status === 200 &&
        swaggerJson.data.openapi === '3.0.3' &&
        swaggerJson.data.info &&
        swaggerJson.data.paths &&
        Object.keys(swaggerJson.data.paths).length >= 10,
      '12. GET /api-docs/json (OpenAPI 3.0.3 Specification)'
    );

    const swaggerRawRes = await fetch(`${baseUrl}/api/v1/swagger.json`);
    assert(swaggerRawRes.status === 200, '13. GET /api/v1/swagger.json');

    const swaggerHtmlRes = await fetch(`${baseUrl}/api-docs/`);
    assert(
      swaggerHtmlRes.status === 200 && (await swaggerHtmlRes.text()).includes('swagger-ui'),
      '14. GET /api-docs/ (Swagger UI HTML)'
    );
  } finally {
    server.close();
    await disconnectDatabase();
  }

  console.log(`\n📊 Verification Summary: ${passed} Passed, ${failed} Failed\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
