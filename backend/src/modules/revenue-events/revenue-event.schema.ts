import { z } from 'zod';

export const IngestRevenueEventSchema = z.object({
  paymentId: z.string().min(1, 'paymentId is required'),
  customerId: z.string().optional(),
  customerName: z.string().min(1, 'customerName is required'),
  amount: z.number().positive('amount must be positive'),
  currency: z.string().default('INR'),
  paymentMethod: z.string().min(1, 'paymentMethod is required'),
  failureReason: z.string().min(1, 'failureReason is required'),
  metadata: z.record(z.unknown()).optional(),
});

export const ListRevenueEventsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['PENDING', 'PROCESSED', 'IGNORED']).optional(),
});

