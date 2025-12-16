import type { Request } from "express";

/**
 * Extended Request interface with Organization context
 * OrgIdGuard attaches orgId, userId, and roles to request object
 */
export interface RequestWithOrg extends Request {
  orgId: string;
  userId: string;
  roles: string[];
}
