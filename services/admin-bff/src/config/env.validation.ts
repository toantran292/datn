import { z } from 'zod';

export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),

  // Identity service URL
  IDENTITY_BASE_URL: z.string().url().default('http://identity:3000'),

  // Security
  ADMIN_HMAC_SECRET: z.string().min(16).default('admin-hmac-secret-change-me'),

  // Cache
  CACHE_TTL_SEC: z.coerce.number().default(60),

  // Timeout
  SERVICE_TIMEOUT_MS: z.coerce.number().default(5000),
});

export type EnvConfig = z.infer<typeof EnvSchema>;
