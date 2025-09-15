import { Socket as IoSocket } from 'socket.io';
export interface AuthenticatedSocket extends IoSocket {
    userId?: string;
    orgId?: string;
}
