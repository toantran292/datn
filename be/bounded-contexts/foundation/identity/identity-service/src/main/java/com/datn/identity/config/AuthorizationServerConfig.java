package com.datn.identity.config;

import com.nimbusds.jose.jwk.*;
import com.nimbusds.jose.jwk.source.*;
import com.nimbusds.jose.proc.SecurityContext;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.server.authorization.client.*;
import org.springframework.security.oauth2.server.authorization.config.annotation.web.configurers.OAuth2AuthorizationServerConfigurer;
import org.springframework.security.oauth2.server.authorization.settings.*;
import org.springframework.security.web.SecurityFilterChain;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

@Configuration
public class AuthorizationServerConfig {

    @Bean
    SecurityFilterChain authzServerChain(HttpSecurity http) throws Exception {
        var asConfigurer = new OAuth2AuthorizationServerConfigurer();

        http
            .securityMatcher(asConfigurer.getEndpointsMatcher())
            .authorizeHttpRequests(a -> a.anyRequest().authenticated())
            .csrf(c -> c.ignoringRequestMatchers(asConfigurer.getEndpointsMatcher()))
            .apply(asConfigurer);

        asConfigurer.oidc(Customizer.withDefaults());
        return http.build();
    }

    @Bean
    AuthorizationServerSettings provider(@Value("${identity.issuer}") String issuer) {
        return AuthorizationServerSettings.builder().issuer(issuer).build();
    }

    @Bean
    RegisteredClientRepository registeredClientRepository() {
        var gateway = RegisteredClient.withId(UUID.randomUUID().toString())
                .clientId("gateway")
                .clientSecret("{noop}gateway-secret")
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .authorizationGrantType(AuthorizationGrantType.REFRESH_TOKEN)
                .redirectUri("http://localhost:3000/api/auth/callback/oidc")
                .scope("openid").scope("profile").scope("email")
                .tokenSettings(TokenSettings.builder()
                        .accessTokenTimeToLive(Duration.ofMinutes(45))
                        .refreshTokenTimeToLive(Duration.ofDays(45)).build())
                .clientSettings(ClientSettings.builder().requireAuthorizationConsent(false).build())
                .build();
        var internal = RegisteredClient.withId(UUID.randomUUID().toString())
                .clientId("internal")
                .clientSecret("{noop}internal-secret")
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                .authorizationGrantType(AuthorizationGrantType.CLIENT_CREDENTIALS)
                .scope("service:read").scope("service:write")
                .tokenSettings(TokenSettings.builder()
                        .accessTokenTimeToLive(Duration.ofMinutes(30)).build())
                .build();

        return new InMemoryRegisteredClientRepository(List.of(gateway, internal));
    }

    @Bean
    JWKSource<SecurityContext> jwkSource() {
        RSAKey rsa = Jwks.generateRsa("rsa-dev");
        JWKSet set = new JWKSet(rsa);  // chỉ cần 1 key đầy đủ
        return (selector, ctx) -> selector.select(set);
    }
}
