package com.datn.identity.infrastructure.security;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.util.UUID;

@Configuration
public class JwtKeysConfig {

    @Bean
    KeyPair rsaKeyPair() {
        try {
            String privPath = System.getenv("RSA_PRIVATE_KEY_PATH");
            String pubPath  = System.getenv("RSA_PUBLIC_KEY_PATH");
            if (privPath != null && !privPath.isBlank() && pubPath != null && !pubPath.isBlank()) {
                var privPem = PemUtils.readPemStringFromPath(privPath);
                var pubPem  = PemUtils.readPemStringFromPath(pubPath);
                var priv = PemUtils.parsePkcs8PrivateKey(privPem);
                var pub  = PemUtils.parseX509PublicKey(pubPem);
                return new KeyPair(pub, priv);
            }
            String privPemEnv = System.getenv("ID_RSA_PRIVATE_PEM");
            String pubPemEnv  = System.getenv("ID_RSA_PUBLIC_PEM");
            if (privPemEnv != null && !privPemEnv.isBlank() && pubPemEnv != null && !pubPemEnv.isBlank()) {
                var priv = PemUtils.parsePkcs8PrivateKey(privPemEnv);
                var pub  = PemUtils.parseX509PublicKey(pubPemEnv);
                return new KeyPair(pub, priv);
            }
            var gen = KeyPairGenerator.getInstance("RSA");
            gen.initialize(2048);
            return gen.generateKeyPair();
        } catch (Exception e) {
            throw new IllegalStateException("cannot init RSA keys", e);
        }
    }

    @Bean
    RSAKey rsaJwk(KeyPair kp) {
        var pub = (RSAPublicKey) kp.getPublic();
        var prv = (RSAPrivateKey) kp.getPrivate();
        return new RSAKey.Builder(pub)
                .privateKey(prv)
                .keyID(UUID.randomUUID().toString())
                .build();
    }

    @Bean
    JWKSource<SecurityContext> jwkSource(RSAKey rsaKey) {
        var jwkSet = new JWKSet(rsaKey);
        return (selector, ctx) -> selector.select(jwkSet);
    }

    @Bean
    JwtEncoder jwtEncoder(JWKSource<SecurityContext> jwkSource) {
        return new NimbusJwtEncoder(jwkSource);
    }

    @Bean
    JwtDecoder jwtDecoder(RSAKey rsaKey) {
        try {
            return NimbusJwtDecoder.withPublicKey(rsaKey.toRSAPublicKey()).build();
        } catch (com.nimbusds.jose.JOSEException e) {
            throw new IllegalStateException("Cannot create JwtDecoder", e);
        }
    }
}