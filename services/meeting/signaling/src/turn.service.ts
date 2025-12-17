import crypto from 'crypto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TurnService {
    iceServers(opts?: { ttl?: number; userId?: string }) {
        const { username, credential } = this.genTurnRestCred(opts?.ttl, opts?.userId);

        const host = process.env.MEET_TURN_HOST!;        // ví dụ: 192.168.100.195 hoặc turn.example.com
        const port = process.env.MEET_TURN_PORT || '40678';  // map của 3478
        const tlsPort = process.env.MEET_TURNS_PORT || '40649'; // map của 5349 (nếu có)

        const servers = [
            { urls: [`stun:${host}:${port}`] },
            {
                urls: [
                    `turn:${host}:${port}?transport=udp`,
                    `turn:${host}:${port}?transport=tcp`,
                ],
                username,
                credential,
            },
        ];

        // Bật nếu bạn đã cấu hình cert cho coturn và expose 5349->40649
        if (process.env.MEET_ENABLE_TURNS === '1') {
            servers.push({
                urls: [`turns:${host}:${tlsPort}`], // TLS tự chọn transport
                username,
                credential,
            } as any);
        }

        return servers;
    }

    /**
     * REST-TURN: username = <unix_expiry>:<any-id>
     * credential = base64( HMAC-SHA1(secret, username) )
     */
    private genTurnRestCred(ttl = 3600, userId = 'meet') {
        const secret = process.env.TURN_SECRET!;
        const expiry = Math.floor(Date.now() / 1000) + ttl;
        const username = `${expiry}:${userId}`;
        const credential = crypto
            .createHmac('sha1', secret)
            .update(username)
            .digest('base64');
        return { username, credential };
    }
}
