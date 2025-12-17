import { User, ProjectId, GroupId } from './user.interface';

export interface Joinable {
    canJoin(user: User, projectId: ProjectId, groupId: GroupId): Promise<boolean>;
}
