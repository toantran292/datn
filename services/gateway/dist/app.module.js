"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const org_middleware_1 = require("./org.middleware");
const http_proxy_middleware_1 = require("http-proxy-middleware");
const IDENTITY_TARGET = (_a = process.env.IDENTITY_URL) !== null && _a !== void 0 ? _a : 'http://localhost:40000';
let AppModule = class AppModule {
    configure(consumer) {
        consumer
            .apply(org_middleware_1.OrgResolverMiddleware)
            .forRoutes({ path: 'o/:org/*', method: common_1.RequestMethod.ALL });
        consumer
            .apply((0, http_proxy_middleware_1.createProxyMiddleware)({
            target: IDENTITY_TARGET,
            changeOrigin: true,
            pathRewrite: (path) => path.replace(/^\/o\/[^/]+/, ''),
            on: {
                proxyReq: (proxyReq, req) => {
                    const org = req.headers['x-org-id'] || 'unknown';
                    proxyReq.setHeader('X-Org-ID', org);
                },
            },
            ws: true,
        }))
            .forRoutes({ path: 'o/:org/auth/*', method: common_1.RequestMethod.ALL });
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({})
], AppModule);
//# sourceMappingURL=app.module.js.map