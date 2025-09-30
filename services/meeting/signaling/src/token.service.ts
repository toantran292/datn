// token.service.ts
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import jwt, { SignOptions } from 'jsonwebtoken';

@Injectable()
export class JwtService {
    private readonly privateKey: Buffer;

    constructor() {
        const keyPath =
            process.env.MEET_JWT_PRIVATE_KEY_PATH // ưu tiên ENV
            ?? path.join(process.cwd(), 'keys/jwtRS256.key'); // fallback dev

        try {
            this.privateKey = fs.readFileSync(keyPath);
        } catch (e: any) {
            // Lỗi rõ ràng để dễ debug khi container không mount key
            throw new Error(`Cannot read JWT private key at ${keyPath}: ${e?.message}`);
        }
    }

    sign(payload: any): string {
        const opts: SignOptions = {
            algorithm: 'RS256',
            expiresIn: '5m',
            // quan trọng: kid phải trùng tên file public key trong Prosody (/config/keys/meet-auth.pub)
            header: {
                kid: process.env.MEET_KID ?? 'meet-auth',
                alg: "RS256"
            },
        };
        return jwt.sign(payload, this.privateKey, opts);
    }
}
