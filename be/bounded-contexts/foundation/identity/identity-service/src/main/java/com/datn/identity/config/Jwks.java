package com.datn.identity.config;

import com.nimbusds.jose.jwk.RSAKey;
import java.security.*;
import java.security.interfaces.*;

final class Jwks {
    static RSAKey generateRsa(String kid) {
        try {
            KeyPairGenerator g = KeyPairGenerator.getInstance("RSA");
            g.initialize(2048);
            KeyPair kp = g.generateKeyPair();
            return new RSAKey.Builder((RSAPublicKey) kp.getPublic())
                    .privateKey((RSAPrivateKey) kp.getPrivate())
                    .keyID(kid).build();
        } catch (Exception e) { throw new RuntimeException(e); }
    }
}