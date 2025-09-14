import { CacheModule } from '@nestjs/cache-manager';
import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { VerifyJwtMiddleware } from './auth/verify-jwt.middleware';
import { JwksService } from './auth/jwks.service';
import { ResolveOrgMiddleware } from './org/resolve-org.middleware';
import { OrgResolverService } from './org/org-resolver.service';
import { ChatModule } from './chat/chat.module';
import { MeetModule } from './meet/meet.module';
import { AuthzService } from './authz/authz.service';
import { EnforceMembershipMiddleware } from './authz/enforce-membership.middleware';

@Module({
  imports: [CacheModule.register({ isGlobal: true }), ChatModule, MeetModule],
  providers: [JwksService, VerifyJwtMiddleware, ResolveOrgMiddleware, OrgResolverService, AuthzService, EnforceMembershipMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    const IDENTITY_BASE_URL = process.env.IDENTITY_BASE_URL ?? 'http://localhost:40000';

    // 1) Proxy /identity/* → Identity (strip /identity)
    consumer
      .apply(
        createProxyMiddleware({
          target: IDENTITY_BASE_URL,
          changeOrigin: true,
          pathRewrite: { '^/identity': '' },
          xfwd: true,
        }),
      )
      .forRoutes({ path: '/identity*', method: RequestMethod.ALL });

    // 2) Org-scoped services under /o/:org/<svc> (microservices via NATS)
    // Only apply auth/org middlewares; controllers will handle routing to microservices
    consumer
      .apply(VerifyJwtMiddleware, ResolveOrgMiddleware, EnforceMembershipMiddleware)
      .forRoutes(
        { path: '/o/:org/chat', method: RequestMethod.ALL },
        { path: '/o/:org/chat/*', method: RequestMethod.ALL },
        { path: '/o/:org/meet', method: RequestMethod.ALL },
        { path: '/o/:org/meet/*', method: RequestMethod.ALL },
      );

    // 3) Identity under org scope: /o/:org/identity/** → Identity /** (rewrite)
    consumer
      .apply(
        VerifyJwtMiddleware,
        ResolveOrgMiddleware,
        EnforceMembershipMiddleware,
        createProxyMiddleware({
          target: IDENTITY_BASE_URL,
          changeOrigin: true,
          xfwd: true,
          pathRewrite: (path) => path.replace(/^\/o\/[^/]+\/identity/, '') || '/',
        }),
      )
      .forRoutes(
        { path: '/o/:org/identity', method: RequestMethod.ALL },
        { path: '/o/:org/identity/*', method: RequestMethod.ALL },
      );

    // 4) OAuth2 endpoints through Gateway
    consumer
      .apply(createProxyMiddleware({ target: IDENTITY_BASE_URL, changeOrigin: true, xfwd: true }))
      .forRoutes(
        { path: '/oauth2*', method: RequestMethod.ALL },
        { path: '/login*', method: RequestMethod.ALL },
      );

    // 5) JWKS
    consumer
      .apply(createProxyMiddleware({ target: IDENTITY_BASE_URL, changeOrigin: true, xfwd: true }))
      .forRoutes({ path: '/.well-known*', method: RequestMethod.ALL });

    // 6) Auth without JWT (register, token)
    consumer
      .apply(createProxyMiddleware({ target: IDENTITY_BASE_URL, changeOrigin: true, xfwd: true }))
      .forRoutes(
        { path: '/auth/register', method: RequestMethod.ALL },
        { path: '/auth/token', method: RequestMethod.ALL },
      );

    // 7) Auth with JWT → verify then proxy (password set)
    consumer
      .apply(
        VerifyJwtMiddleware,
        createProxyMiddleware({ target: IDENTITY_BASE_URL, changeOrigin: true, xfwd: true }),
      )
      .forRoutes({ path: '/auth/password/set', method: RequestMethod.ALL });
  }
}
