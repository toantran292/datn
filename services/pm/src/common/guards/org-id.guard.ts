import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { RequestWithOrg } from "../interfaces";
import { SKIP_ORG_CHECK_KEY } from "../decorators/skip-org-check.decorator";

@Injectable()
export class OrgIdGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if the route has @SkipOrgCheck() decorator
    const skipOrgCheck = this.reflector.getAllAndOverride<boolean>(SKIP_ORG_CHECK_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipOrgCheck) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithOrg>();
    const orgId = request.headers["x-org-id"] as string;
    const userId = request.headers["x-user-id"] as string;
    const rolesHeader = request.headers["x-roles"] as string;

    if (!orgId || orgId.trim() === "") {
      throw new UnauthorizedException("Organization ID is required. X-Org-ID header is missing or empty.");
    }

    request.orgId = orgId;
    request.userId = userId || "";
    request.roles = rolesHeader ? rolesHeader.split(",").map((r) => r.trim()) : [];

    return true;
  }
}
