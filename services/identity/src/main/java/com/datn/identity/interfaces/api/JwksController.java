package com.datn.identity.interfaces.api;

import com.nimbusds.jose.jwk.*;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
public class JwksController {
    private final RSAKey rsaJwk;

    public JwksController(RSAKey rsaJwk) { this.rsaJwk = rsaJwk; }

    @GetMapping(value = "/.well-known/jwks.json", produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> jwks() {
        return new JWKSet(rsaJwk.toPublicJWK()).toJSONObject();
    }
}