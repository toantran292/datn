"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextAuthMiddleware = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
let ContextAuthMiddleware = class ContextAuthMiddleware {
    constructor() {
        this.skewSeconds = 300; // 5 minutes
    }
    use(req, res, next) {
        const userId = String(req.headers['x-user-id'] || '');
        const orgId = String(req.headers['x-org-id'] || '');
        const ts = String(req.headers['x-context-timestamp'] || '');
        const signature = String(req.headers['x-context-signature'] || '');
        if (!userId || !orgId || !ts || !signature) {
            return this.unauthorized(res);
        }
        const secret = process.env.CONTEXT_HMAC_SECRET;
        if (!secret) {
            // Server misconfiguration; respond 500 to avoid false positives
            res.status(500).json({ error: 'Server not configured' });
            return;
        }
        const tsNum = Number(ts);
        if (!Number.isFinite(tsNum)) {
            return this.unauthorized(res);
        }
        const nowSec = Math.floor(Date.now() / 1000);
        const skew = Math.abs(nowSec - Math.floor(tsNum));
        if (skew > this.skewSeconds) {
            return this.unauthorized(res);
        }
        const payload = `${userId}|${orgId}|${Math.floor(tsNum)}`;
        const expectedHex = (0, crypto_1.createHmac)('sha256', secret).update(payload).digest('hex');
        // timing-safe compare on same-length buffers
        const a = Buffer.from(expectedHex, 'utf8');
        const b = Buffer.from(signature, 'utf8');
        if (a.length !== b.length || !(0, crypto_1.timingSafeEqual)(a, b)) {
            return this.unauthorized(res);
        }
        // Attach context to request if needed downstream
        req.context = { userId, orgId, ts: Math.floor(tsNum) };
        next();
    }
    unauthorized(res) {
        res.status(401).json({ error: 'Unauthorized' });
    }
};
exports.ContextAuthMiddleware = ContextAuthMiddleware;
exports.ContextAuthMiddleware = ContextAuthMiddleware = __decorate([
    (0, common_1.Injectable)()
], ContextAuthMiddleware);
