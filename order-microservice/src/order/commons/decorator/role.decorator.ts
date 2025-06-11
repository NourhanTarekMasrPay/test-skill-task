import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to specify which roles are allowed to access a route.
 * Use it like: `@Roles('admin', 'user')`
 */
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);