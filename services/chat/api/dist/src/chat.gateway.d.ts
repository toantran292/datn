import { MessageBody, OnGatewayConnection, OnGatewayDisconnect } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import type { AuthenticatedSocket } from "../common/types/socket.types";
type MessageBody = {
    roomId: string;
    text: string;
};
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    io: Server;
    handleConnection(client: AuthenticatedSocket): void;
    handleDisconnect(client: AuthenticatedSocket): void;
    afterInit(server: Server): void;
    handleSendMessage(payload: MessageBody, client: AuthenticatedSocket): void;
    handleJoinRoom({ roomId }: {
        roomId: string;
    }, client: AuthenticatedSocket): void;
    leave({ roomId }: {
        roomId: string;
    }, client: Socket): void;
}
export {};
