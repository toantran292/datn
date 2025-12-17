export type UserId = string;
export type OrgId = string;
export type ProjectId = string;
export type GroupId = string;

export interface User {
    id: UserId;
    orgId: OrgId;
}
