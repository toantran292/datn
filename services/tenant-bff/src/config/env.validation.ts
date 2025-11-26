import { z } from 'zod';

export const EnvSchema = z.object({
  PORT: z.coerce.number().default(8085),
  NODE_ENV: z.string().default('development'),
  BFF_HMAC_SECRET: z.string(),
  CLOCK_SKEW_SEC: z.coerce.number().default(300),
  REPLAY_TTL_SEC: z.coerce.number().default(60),
  IDENTITY_BASE_URL: z.string().url(),
  SERVICE_TIMEOUT_MS: z.coerce.number().default(3500),
  CACHE_TTL_SEC: z.coerce.number().default(60),
});

export type Env = z.infer<typeof EnvSchema>;
