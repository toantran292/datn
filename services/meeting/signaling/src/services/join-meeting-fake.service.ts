import { Injectable } from '@nestjs/common';

type Subject = 'chat' | 'project';

@Injectable()
export class JoinMeetingFake {
    // ====== CONFIG ======
    // private readonly CHAT_ROOM_ID = 'chat-global'; // one and only

    // ====== MOCK MEMBERSHIP ======
    private readonly userChats: Record<string, string[]> = {
        'user-1': ['chat-1', 'chat-2'],
        'user-2': ['chat-1', 'chat-2'],
        'user-3': ['chat-2'],
        'user-4': ['chat-3', 'chat-4'],
        'user-5': ['chat-4'],
    };

    private readonly userProjects: Record<string, string[]> = {
        'user-1': ['project-1', 'project-2'],
        'user-2': ['project-1', 'project-3'],
        'user-3': ['project-2'],
        'user-4': ['project-3', 'project-4'],
        'user-5': ['project-4'],
    };

    // ====== PROJECT ROOM MAPPING (unlimited) ======
    // roomId -> projectId
    private readonly roomToProject = new Map<string, string>();

    /** Đăng ký map roomId -> projectId (khi tạo room hoặc trước khi phát token) */
    registerProjectRoom(roomId: string, projectId: string) {
        this.roomToProject.set(roomId, projectId);
    }

    /** Lấy projectId từ roomId (debug/verify) */
    getProjectByRoom(roomId: string) {
        return this.roomToProject.get(roomId);
    }

    /** Kiểm tra membership cho Chat */
    isChatMember(userId: string, chatId: string) {
        const chats = this.userChats[userId] || [];
        return chats.includes(chatId);
    }

    /** Kiểm tra membership cho Project */
    isProjectMember(userId: string, projectId: string) {
        const projects = this.userProjects[userId] || [];
        return projects.includes(projectId);
    }

    /** Auth tổng hợp để phát token (đúng spec) */
    async canIssueToken(args: {
        userId: string;
        subjectType: Subject;
        chatId?: string;
        projectId?: string;
        roomId?: string; // với project
    }): Promise<{ ok: boolean; roomId?: string }> {
        await new Promise((r) => setTimeout(r, 10));

        if (args.subjectType === 'chat') {
            if (!args.chatId) return { ok: false };
            const ok = this.isChatMember(args.userId, args.chatId);
            return ok ? { ok: true, roomId: args.chatId } : { ok: false };
        }

        // project
        if (!args.projectId) return { ok: false };

        if (!this.isProjectMember(args.userId, args.projectId)) {
            return { ok: false };
        }

        // room phải map về project. Nếu client gửi roomId mới → register.
        const roomId = args.roomId!;
        const mapped = this.roomToProject.get(roomId);
        if (!mapped) {
            this.registerProjectRoom(roomId, args.projectId);
            return { ok: true, roomId };
        }

        // đã có mapping → phải khớp projectId
        return { ok: mapped === args.projectId, roomId };
    }
}
