package com.datn.identity.infrastructure.security;

import com.datn.identity.application.TokenService;
import com.datn.identity.application.UserApplicationService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Set;

@Component
public class GoogleOAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final UserApplicationService userApp;
    private final TokenService tokens;

    public GoogleOAuth2SuccessHandler(UserApplicationService userApp, TokenService tokens) {
        this.userApp = userApp;
        this.tokens = tokens;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        String sub = null, email = null;

        if (authentication.getPrincipal() instanceof OidcUser oidc) {
            sub = oidc.getSubject();
            email = oidc.getEmail();
        } else if (authentication.getPrincipal() instanceof OAuth2User ou) {
            var attrs = ou.getAttributes();
            sub = attrs.get("sub") != null ? attrs.get("sub").toString() : null;
            email = attrs.get("email") != null ? attrs.get("email").toString() : null;
        }

        if (sub == null || email == null) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "google_profile_missing");
            return;
        }

        try {
            var result = userApp.registerOrLinkGoogle(sub, email);
            // Issue access token immediately (logged-in state) without org context
            var accessToken = tokens.issueAccessToken(result.userId(), result.email(), null, Set.of());
            var target = URI.create("http://localhost:5173/oauth2/callback"
                    + "?access_token=" + URLEncoder.encode(accessToken, StandardCharsets.UTF_8)
                    + "&token_type=Bearer&expires_in=3600"
                    + "&user_id=" + URLEncoder.encode(result.userId().toString(), StandardCharsets.UTF_8)
                    + "&email=" + URLEncoder.encode(result.email(), StandardCharsets.UTF_8)
                    + "&need_password=" + (result.mustChangePassword() ? "true" : "false"));
            response.sendRedirect(target.toString());
        } catch (IllegalStateException exSync) {
            if ("google_sync_not_allowed".equals(exSync.getMessage())) {
                var target = URI.create("http://localhost:5173/oauth2/callback"
                        + "?error=" + URLEncoder.encode("google_sync_not_allowed", StandardCharsets.UTF_8)
                        + "&email=" + URLEncoder.encode(email, StandardCharsets.UTF_8));
                response.sendRedirect(target.toString());
            } else {
                response.sendError(HttpServletResponse.SC_BAD_REQUEST, exSync.getMessage());
            }
        }
    }
}
