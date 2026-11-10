import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
/**
 * Mark any endpoint or controller with @Public() to bypass the global SupabaseAuthGuard.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

