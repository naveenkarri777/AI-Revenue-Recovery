import { z } from 'zod';

export const ListCasesQuerySchema = z.object({
  query: z.string().optional(),
  status: z.string().optional(),
  risk: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(10),
});

export const CaseParamSchema = z.object({
  id: z.string().min(1, 'Case ID is required'),
});

