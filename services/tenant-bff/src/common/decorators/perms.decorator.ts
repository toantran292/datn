import { SetMetadata } from '@nestjs/common';

export const PERMS_KEY = 'perms';
export const Perms = (...perms: string[]) => SetMetadata(PERMS_KEY, perms);
