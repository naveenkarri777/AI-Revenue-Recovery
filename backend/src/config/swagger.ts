import { CaseStatus, RiskLevel, RootCause, StrategyType, TimelineKind, AuditStatus, ActivityCategory } from '../shared/constants/enums.js';

export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'AI Revenue Recovery API',
    version: '1.0.0',
    description: `
**AI Revenue Recovery Engine API**

Automated autonomous revenue recovery platform for billing, subscriptions, and payment processing.
Provides intelligent failed payment detection, multi-agent AI root cause diagnosis, deterministic policy guardrail enforcement, payment simulator execution, and real-time recovery analytics.

### Key Architectural Layers:
- **Revenue Risk Ingestion**: Listens for failed payment webhooks and revenue events.
- **AI Decision Agent**: Multi-model LLM diagnosis (Gemini, OpenAI, Heuristic fallback) producing strict structured recovery strategies.
- **Deterministic Policy Engine**: Pure guardrails enforcing retry caps, customer contact limits, SLA windows, and human escalation thresholds.
- **Action Dispatcher**: Executes automated payment retries, customer payment update notifications, and escalation workflows.
- **Immutable Audit Trail**: Records structured timeline and audit logs at every decision and execution step.
    `,
    contact: {
      name: 'AI Revenue Recovery Engineering Team',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API v1 Base',
    },
    {
      url: '/',
      description: 'Root Server',
    },
  ],
  tags: [
    {
      name: 'Recovery Cases',
      description: 'Recovery workflow monitoring, case search, filtering, and manual/automated processing.',
    },
    {
      name: 'Dashboard',
      description: 'Aggregated KPIs, 7-day revenue trend metrics, and recovery funnel progression.',
    },
    {
      name: 'Revenue Events',
      description: 'Failed payment event ingestion and event listing.',
    },
    {
      name: 'Demo Simulation',
      description: 'Batch simulation of 20 realistic revenue-risk recovery cases through the AI engine.',
    },
    {
      name: 'Activity Feed',
      description: 'Real-time event stream of AI decisions, policy checks, and recovery actions.',
    },
    {
      name: 'Settings & Policies',
      description: 'Configurable guardrails, auto-escalation limits, and AI confidence thresholds.',
    },
    {
      name: 'System',
      description: 'System health checks and telemetry.',
    },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Server Health Check',
        description: 'Returns the operational status and current timestamp of the API server.',
        responses: {
          '200': {
            description: 'Server is healthy and reachable.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    timestamp: { type: 'string', format: 'date-time', example: '2026-08-26T10:30:00.000Z' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/revenue-events': {
      post: {
        tags: ['Revenue Events'],
        summary: 'Ingest Failed Payment Event',
        description: 'Ingests a new failed payment revenue risk event, registers the event in MongoDB, and automatically provisions an active RecoveryCase.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/IngestRevenueEventRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Revenue event ingested and recovery case spawned.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Revenue event ingested successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        event: { $ref: '#/components/schemas/RevenueEvent' },
                        recoveryCase: { $ref: '#/components/schemas/RecoveryCase' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Validation error in request payload.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorResponse' },
              },
            },
          },
        },
      },
      get: {
        tags: ['Revenue Events'],
        summary: 'List Revenue Events',
        description: 'Returns a paginated list of ingested revenue events with optional status filtering.',
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
            description: 'Page number for pagination',
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 20 },
            description: 'Items per page',
          },
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['PENDING', 'PROCESSED', 'IGNORED'] },
            description: 'Filter events by processing status',
          },
        ],
        responses: {
          '200': {
            description: 'Paginated list of revenue events.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        items: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/RevenueEvent' },
                        },
                        total: { type: 'integer', example: 45 },
                        page: { type: 'integer', example: 1 },
                        pageSize: { type: 'integer', example: 20 },
                        totalPages: { type: 'integer', example: 3 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/revenue-events/{id}': {
      get: {
        tags: ['Revenue Events'],
        summary: 'Get Revenue Event by ID',
        description: 'Fetches a single revenue event by its eventId or MongoDB ObjectId.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Event ID (e.g. EVT-80123)',
          },
        ],
        responses: {
          '200': {
            description: 'Revenue event found.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/RevenueEvent' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Event not found.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/recovery-cases': {
      get: {
        tags: ['Recovery Cases'],
        summary: 'List & Search Recovery Cases',
        description: 'Returns a paginated list of recovery cases formatted for the frontend table with search, status filter, risk filter, and status summary tile counters.',
        parameters: [
          {
            name: 'query',
            in: 'query',
            schema: { type: 'string' },
            description: 'Search string across customer name, case ID, or payment ID',
          },
          {
            name: 'status',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['All Statuses', 'Active', 'Retry Scheduled', 'Recovered', 'Escalated', 'Stopped', 'Failed'],
            },
            description: 'Filter by case status',
          },
          {
            name: 'risk',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['All Risk', 'High', 'Medium', 'Low'],
            },
            description: 'Filter by risk level',
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
            description: 'Page index',
          },
          {
            name: 'pageSize',
            in: 'query',
            schema: { type: 'integer', default: 10 },
            description: 'Page size',
          },
        ],
        responses: {
          '200': {
            description: 'List of recovery cases with pagination and status counts.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RecoveryCaseListResponse' },
              },
            },
          },
        },
      },
    },
    '/recovery-cases/stats': {
      get: {
        tags: ['Recovery Cases'],
        summary: 'Get Case Status Summary Statistics',
        description: 'Returns current counts of recovery cases across all statuses (all, active, recovered, escalated, stopped).',
        responses: {
          '200': {
            description: 'Case status statistics.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/StatusStats' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/recovery-cases/{id}': {
      get: {
        tags: ['Recovery Cases'],
        summary: 'Get Case Detail by Case ID',
        description: 'Fetches complete case details including customer history, guardrails, full timeline events, and audit logs.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', example: 'RC-1024' },
            description: 'Case Identifier (e.g. RC-1024)',
          },
        ],
        responses: {
          '200': {
            description: 'Full recovery case details.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/RecoveryCase' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Case not found.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/recovery-cases/{id}/process': {
      post: {
        tags: ['Recovery Cases'],
        summary: 'Process Case through AI Recovery Pipeline',
        description: `
Executes the full automated AI Recovery workflow for a specific case:
1. **Context Builder**: Assembles payment context, customer history, and guardrail constraints.
2. **AI Agent**: Analyzes failure reason and diagnoses root cause and recommended strategy with strict Zod validation.
3. **Policy Engine**: Validates deterministic guardrails (retry caps, contact caps, window, high-value thresholds).
4. **Action Executor**: Executes approved strategy via payment simulator or notification dispatcher.
5. **Audit Logger**: Appends immutable timeline and audit log entries before persisting state.
        `,
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', example: 'RC-1025' },
            description: 'Case Identifier',
          },
        ],
        responses: {
          '200': {
            description: 'Case processed successfully.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Case #RC-1025 processed successfully' },
                    data: { $ref: '#/components/schemas/RecoveryCase' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Case not found.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/recovery-cases/{id}/logs': {
      get: {
        tags: ['Recovery Cases'],
        summary: 'Get Case Audit Logs',
        description: 'Retrieves chronological audit log entries for the specified case.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', example: 'RC-1024' },
            description: 'Case Identifier',
          },
        ],
        responses: {
          '200': {
            description: 'List of audit log entries.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/AuditEntry' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/recovery/dashboard': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get Recovery Dashboard Analytics',
        description: 'Aggregates real-time KPIs (revenue at risk, revenue recovered, recovery rate, active cases), 7-day trend chart metrics, funnel step counts, and recent recovery cases.',
        responses: {
          '200': {
            description: 'Dashboard analytics data payload.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/DashboardData' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/demo/run-batch': {
      post: {
        tags: ['Demo Simulation'],
        summary: 'Run Demo Batch Simulation',
        description: 'Simulates processing 20 synthetic revenue-risk events across various customer payment histories and root causes through the AI pipeline, returning aggregate batch performance metrics.',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  batchSize: { type: 'integer', default: 20, description: 'Number of demo cases to generate and process' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Batch simulation completed.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Batch simulation of 20 cases completed successfully' },
                    data: { $ref: '#/components/schemas/BatchSimulationResult' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/activity': {
      get: {
        tags: ['Activity Feed'],
        summary: 'Get Live Activity Feed',
        description: 'Returns a real-time event feed of recent AI diagnoses, recovery actions, completed recoveries, and policy guardrail events.',
        parameters: [
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 20 },
            description: 'Max number of items to return',
          },
        ],
        responses: {
          '200': {
            description: 'List of activity items.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/ActivityItem' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/settings/policies': {
      get: {
        tags: ['Settings & Policies'],
        summary: 'Get Recovery Policies',
        description: 'Fetches the active guardrails and escalation thresholds.',
        responses: {
          '200': {
            description: 'Active recovery policies.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/PolicySettings' },
                  },
                },
              },
            },
          },
        },
      },
      put: {
        tags: ['Settings & Policies'],
        summary: 'Update Recovery Policies',
        description: 'Updates active guardrail limits, approval thresholds, or contact caps.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdatePolicySettingsRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Recovery policies updated successfully.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Policy settings updated successfully' },
                    data: { $ref: '#/components/schemas/PolicySettings' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      CaseStatus: {
        type: 'string',
        enum: Object.values(CaseStatus),
        example: 'Active',
      },
      RiskLevel: {
        type: 'string',
        enum: Object.values(RiskLevel),
        example: 'High',
      },
      RootCause: {
        type: 'string',
        enum: Object.values(RootCause),
        example: 'Insufficient Funds',
      },
      StrategyType: {
        type: 'string',
        enum: Object.values(StrategyType),
        example: 'Retry Payment',
      },
      TimelineKind: {
        type: 'string',
        enum: Object.values(TimelineKind),
        example: 'detect',
      },
      AuditStatus: {
        type: 'string',
        enum: Object.values(AuditStatus),
        example: 'success',
      },
      TimelineEvent: {
        type: 'object',
        properties: {
          timestamp: { type: 'string', format: 'date-time', example: '2026-08-23T10:52:00.000Z' },
          label: { type: 'string', example: 'Payment failed' },
          detail: { type: 'string', example: '₹2,000 payment failed — Reason: Insufficient Funds' },
          kind: { $ref: '#/components/schemas/TimelineKind' },
        },
        required: ['timestamp', 'label', 'detail', 'kind'],
      },
      AuditEntry: {
        type: 'object',
        properties: {
          action: { type: 'string', example: 'PAYMENT_FAILED' },
          actor: { type: 'string', example: 'System' },
          result: { type: 'string', example: 'Detected' },
          timestamp: { type: 'string', format: 'date-time', example: '2026-08-23T10:52:00.000Z' },
          status: { $ref: '#/components/schemas/AuditStatus' },
        },
        required: ['action', 'actor', 'result', 'timestamp', 'status'],
      },
      PaymentHistory: {
        type: 'object',
        properties: {
          successfulPayments: { type: 'integer', example: 14 },
          previousFailures: { type: 'integer', example: 1 },
          totalPaid: { type: 'number', example: 28000 },
        },
        required: ['successfulPayments', 'previousFailures', 'totalPaid'],
      },
      Guardrails: {
        type: 'object',
        properties: {
          retryUsed: { type: 'integer', example: 1 },
          retryMax: { type: 'integer', example: 3 },
          contactUsed: { type: 'integer', example: 0 },
          contactMax: { type: 'integer', example: 2 },
          windowUsedDays: { type: 'integer', example: 2 },
          windowMaxDays: { type: 'integer', example: 7 },
          eligible: { type: 'boolean', example: true },
          withinWindow: { type: 'boolean', example: true },
          actionPermitted: { type: 'boolean', example: true },
        },
        required: [
          'retryUsed',
          'retryMax',
          'contactUsed',
          'contactMax',
          'windowUsedDays',
          'windowMaxDays',
          'eligible',
          'withinWindow',
          'actionPermitted',
        ],
      },
      RecoveryCase: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'RC-1024' },
          customerName: { type: 'string', example: 'Rahul Kumar' },
          customerId: { type: 'string', example: 'CUS-1024' },
          paymentId: { type: 'string', example: 'PAY-80124' },
          paymentMethod: { type: 'string', example: 'Visa •••• 4242' },
          amountAtRisk: { type: 'number', example: 2000 },
          amountRecovered: { type: 'number', example: 2000 },
          status: { $ref: '#/components/schemas/CaseStatus' },
          risk: { $ref: '#/components/schemas/RiskLevel' },
          rootCause: { $ref: '#/components/schemas/RootCause' },
          strategy: { $ref: '#/components/schemas/StrategyType' },
          strategyDetail: { type: 'string', example: 'Retry payment after 24 hours' },
          aiConfidence: { type: 'number', example: 92 },
          reasoning: { type: 'string', example: 'Strong payment history supports automated recovery retry.' },
          nextActionLabel: { type: 'string', nullable: true, example: null },
          nextActionAt: { type: 'string', format: 'date-time', nullable: true, example: null },
          history: { $ref: '#/components/schemas/PaymentHistory' },
          guardrails: { $ref: '#/components/schemas/Guardrails' },
          timeline: {
            type: 'array',
            items: { $ref: '#/components/schemas/TimelineEvent' },
          },
          auditLog: {
            type: 'array',
            items: { $ref: '#/components/schemas/AuditEntry' },
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: [
          'id',
          'customerName',
          'customerId',
          'paymentId',
          'paymentMethod',
          'amountAtRisk',
          'amountRecovered',
          'status',
          'risk',
          'rootCause',
          'strategy',
          'strategyDetail',
          'aiConfidence',
          'reasoning',
          'history',
          'guardrails',
          'timeline',
          'auditLog',
          'createdAt',
          'updatedAt',
        ],
      },
      StatusStats: {
        type: 'object',
        properties: {
          all: { type: 'integer', example: 30 },
          active: { type: 'integer', example: 8 },
          recovered: { type: 'integer', example: 14 },
          escalated: { type: 'integer', example: 4 },
          stopped: { type: 'integer', example: 4 },
        },
        required: ['all', 'active', 'recovered', 'escalated', 'stopped'],
      },
      RecoveryCaseListResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: { $ref: '#/components/schemas/RecoveryCase' },
              },
              total: { type: 'integer', example: 30 },
              page: { type: 'integer', example: 1 },
              pageSize: { type: 'integer', example: 10 },
              totalPages: { type: 'integer', example: 3 },
            },
          },
          meta: {
            type: 'object',
            properties: {
              stats: { $ref: '#/components/schemas/StatusStats' },
            },
          },
        },
      },
      RevenueEvent: {
        type: 'object',
        properties: {
          eventId: { type: 'string', example: 'EVT-10293' },
          customerId: { type: 'string', example: 'CUS-99120' },
          customerName: { type: 'string', example: 'Rahul Kumar' },
          paymentId: { type: 'string', example: 'PAY-88129' },
          amount: { type: 'number', example: 2000 },
          currency: { type: 'string', example: 'INR' },
          paymentMethod: { type: 'string', example: 'Visa •••• 4242' },
          failureReason: { type: 'string', example: 'Insufficient Funds' },
          status: { type: 'string', enum: ['PENDING', 'PROCESSED', 'IGNORED'], example: 'PROCESSED' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: ['eventId', 'customerId', 'customerName', 'paymentId', 'amount', 'currency', 'paymentMethod', 'failureReason', 'status'],
      },
      IngestRevenueEventRequest: {
        type: 'object',
        properties: {
          paymentId: { type: 'string', example: 'PAY-88129' },
          customerId: { type: 'string', example: 'CUS-99120' },
          customerName: { type: 'string', example: 'Rahul Kumar' },
          amount: { type: 'number', example: 2000 },
          currency: { type: 'string', default: 'INR', example: 'INR' },
          paymentMethod: { type: 'string', example: 'Visa •••• 4242' },
          failureReason: { type: 'string', example: 'Insufficient balance in account' },
          metadata: { type: 'object' },
        },
        required: ['paymentId', 'customerName', 'amount', 'paymentMethod', 'failureReason'],
      },
      DashboardKpis: {
        type: 'object',
        properties: {
          revenueAtRisk: { type: 'number', example: 48500 },
          revenueAtRiskChange: { type: 'number', example: 12.4 },
          revenueRecovered: { type: 'number', example: 31200 },
          recoveryRate: { type: 'number', example: 64.3 },
          activeCases: { type: 'integer', example: 18 },
          actionsScheduled: { type: 'integer', example: 7 },
          successfulRecoveries: { type: 'integer', example: 12 },
          successfulRecoveriesChange: { type: 'number', example: 18.2 },
        },
        required: [
          'revenueAtRisk',
          'revenueAtRiskChange',
          'revenueRecovered',
          'recoveryRate',
          'activeCases',
          'actionsScheduled',
          'successfulRecoveries',
          'successfulRecoveriesChange',
        ],
      },
      RevenueTrendPoint: {
        type: 'object',
        properties: {
          day: { type: 'string', example: 'Mon' },
          atRisk: { type: 'number', example: 6200 },
          recovered: { type: 'number', example: 3800 },
        },
        required: ['day', 'atRisk', 'recovered'],
      },
      RecoveryFunnelStep: {
        type: 'object',
        properties: {
          label: { type: 'string', example: 'Revenue at Risk' },
          value: { type: 'number', example: 48500 },
        },
        required: ['label', 'value'],
      },
      DashboardData: {
        type: 'object',
        properties: {
          kpis: { $ref: '#/components/schemas/DashboardKpis' },
          trend: {
            type: 'array',
            items: { $ref: '#/components/schemas/RevenueTrendPoint' },
          },
          funnel: {
            type: 'array',
            items: { $ref: '#/components/schemas/RecoveryFunnelStep' },
          },
          recentCases: {
            type: 'array',
            items: { $ref: '#/components/schemas/RecoveryCase' },
          },
        },
        required: ['kpis', 'trend', 'funnel', 'recentCases'],
      },
      BatchSimulationResult: {
        type: 'object',
        properties: {
          atRisk: { type: 'number', example: 50000 },
          recovered: { type: 'number', example: 32000 },
          rate: { type: 'number', example: 64 },
          successful: { type: 'integer', example: 12 },
          escalated: { type: 'integer', example: 3 },
          stoppedFailed: { type: 'integer', example: 5 },
          processedCount: { type: 'integer', example: 20 },
          cases: {
            type: 'array',
            items: { $ref: '#/components/schemas/RecoveryCase' },
          },
        },
        required: ['atRisk', 'recovered', 'rate', 'successful', 'escalated', 'stoppedFailed', 'processedCount', 'cases'],
      },
      ActivityItem: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'AUD-abc12345' },
          caseId: { type: 'string', example: 'RC-1024' },
          message: { type: 'string', example: '₹2,000 recovered' },
          category: {
            type: 'string',
            enum: Object.values(ActivityCategory),
            example: 'Successful',
          },
          timestamp: { type: 'string', format: 'date-time' },
          icon: {
            type: 'string',
            enum: ['success', 'retry', 'escalate', 'stop', 'detect'],
            example: 'success',
          },
        },
        required: ['id', 'caseId', 'message', 'category', 'timestamp', 'icon'],
      },
      PolicySettings: {
        type: 'object',
        properties: {
          maxPaymentRetries: { type: 'integer', example: 3 },
          maxCustomerContacts: { type: 'integer', example: 2 },
          maxRecoveryWindowDays: { type: 'integer', example: 7 },
          autoEscalation: { type: 'boolean', example: true },
          highValueThreshold: { type: 'number', example: 25000 },
          aiConfidenceThreshold: { type: 'number', example: 80 },
        },
        required: [
          'maxPaymentRetries',
          'maxCustomerContacts',
          'maxRecoveryWindowDays',
          'autoEscalation',
          'highValueThreshold',
          'aiConfidenceThreshold',
        ],
      },
      UpdatePolicySettingsRequest: {
        type: 'object',
        properties: {
          maxPaymentRetries: { type: 'integer', minimum: 1, maximum: 5 },
          maxCustomerContacts: { type: 'integer', minimum: 0, maximum: 5 },
          maxRecoveryWindowDays: { type: 'integer', minimum: 1, maximum: 30 },
          autoEscalation: { type: 'boolean' },
          highValueThreshold: { type: 'number', minimum: 1000 },
          aiConfidenceThreshold: { type: 'number', minimum: 50, maximum: 99 },
        },
      },
      ApiErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Resource not found' },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'NOT_FOUND' },
              details: { type: 'object' },
            },
          },
          requestId: { type: 'string', example: 'req-xyz123' },
        },
        required: ['success', 'message'],
      },
    },
  },
};

