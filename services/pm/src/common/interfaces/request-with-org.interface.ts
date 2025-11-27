import type { Request } from "express";

/**
 * Extended Request interface with Organization ID
 * OrgIdGuard attaches orgId to request object
 */
export interface RequestWithOrg extends Request {
  orgId: string;
}
