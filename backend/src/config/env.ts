import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/ai_revenue_recovery'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  LLM_PROVIDER: z.enum(['heuristic', 'gemini', 'openai']).default('heuristic'),
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  OPENAI_API_KEY: z.string().optional().default(''),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),

  POLICY_MAX_PAYMENT_RETRIES: z.coerce.number().default(3),
  POLICY_MAX_CUSTOMER_CONTACTS: z.coerce.number().default(2),
  POLICY_MAX_RECOVERY_WINDOW_DAYS: z.coerce.number().default(7),
  POLICY_AUTO_ESCALATION: z.coerce.boolean().default(true),
  POLICY_HIGH_VALUE_THRESHOLD: z.coerce.number().default(25000),
  POLICY_AI_CONFIDENCE_THRESHOLD: z.coerce.number().default(80),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;

