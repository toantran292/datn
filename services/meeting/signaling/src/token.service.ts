import * as fs from 'fs';
import * as path from 'path';
import * as jwt from 'jsonwebtoken';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtService {
    private secret = process.env.MEET_APP_SECRET || 'superlongrandomsecret123';
    sign(payload: any) {
        // Với JWT_PUBLIC_KEY_PATH, KHÔNG cần 'kid'
        // return jwt.sign(payload, this.key, {
        //     algorithm: 'RS256',
        //     expiresIn: '5m',
        //     keyid: process.env.MEET_KID ?? 'jwtRS256.key',
        // });
        return jwt.sign(payload, this.secret, {
            algorithm: 'HS256',
            expiresIn: '1h',
            notBefore: '-30s',
        });
    }
}
