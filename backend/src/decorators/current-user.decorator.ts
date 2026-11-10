import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extracts the authenticated Supabase user or a specific field (like 'id')
 * attached to req.user by SupabaseAuthGuard.
 *
 * Example:
 *   @CurrentUser('id') userId: string
 *   @CurrentUser() user: any
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      return null;
    }
    return data ? user[data] : user;
  },
);

