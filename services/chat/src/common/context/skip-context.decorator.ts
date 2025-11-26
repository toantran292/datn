import { SetMetadata } from '@nestjs/common';
import { SKIP_CONTEXT_KEY } from './request-context.guard';
export const SkipContext = () => SetMetadata(SKIP_CONTEXT_KEY, true);
