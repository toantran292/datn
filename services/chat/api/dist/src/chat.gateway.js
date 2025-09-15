"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
let ChatGateway = class ChatGateway {
    io;
    handleConnection(client) {
        const userId = client.userId;
        console.log(`[WS] Connected: ${client.id} user: ${userId}`);
    }
    handleDisconnect(client) {
        console.log(`[WS] Disconnected: ${client.id}`);
    }
    afterInit(server) {
        server.use((socket, next) => {
            const userId = socket.handshake.headers["x-user-id"];
            const orgId = socket.handshake.headers["x-org-id"];
            if (!userId || !orgId) {
                return next(new Error('Unauthorized: Missing headers'));
            }
            socket.userId = userId;
            socket.orgId = orgId;
            next();
        });
    }
    handleSendMessage(payload, client) {
        this.io.to(payload.roomId).emit('new_message', {
            from: client.id,
            text: payload.text,
            at: Date.now(),
        });
    }
    handleJoinRoom({ roomId }, client) {
        client.join(roomId);
        client.emit('joined_room', roomId);
    }
    leave({ roomId }, client) {
        client.leave(roomId);
        client.emit('left_room', roomId);
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "io", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('send_message'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_a = typeof websockets_1.MessageBody !== "undefined" && websockets_1.MessageBody) === "function" ? _a : Object, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleSendMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_room'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave_room'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "leave", null);
exports.ChatGateway = ChatGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        namespace: 'chat',
    })
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map