import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; 

    if (!user || !user.realm_access || !user.realm_access.roles) {
      throw new ForbiddenException('User roles not found in token.');
    }

    const userRoles: string[] = user.realm_access.roles;

    const hasRequiredRole = requiredRoles.some((role) => userRoles.includes(role));

    if (!hasRequiredRole) {
      throw new ForbiddenException(`Insufficient permissions. Required role(s): ${requiredRoles.join(', ')}.`);
    }

    return true;
  }
}