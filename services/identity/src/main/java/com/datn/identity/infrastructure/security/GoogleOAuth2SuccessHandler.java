package com.datn.identity.infrastructure.security;

import com.datn.identity.application.TokenService;
import com.datn.identity.application.UserApplicationService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Duration;
import java.util.Set;

@Component
public class GoogleOAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final UserApplicationService userApp;
    private final TokenService tokens;

    // ----- cấu hình dev/prod qua env -----
    @Value("${uts.auth.web-url:http://localhost:3000}")  // nơi FE auth-web chạy
    private String authWebUrl;

    @Value("${uts.cookie.domain:localhost}")              // ".unifiedteamspace.com" trên prod, "localhost" trên dev
    private String cookieDomain;

    @Value("${uts.cookie.secure:false}")                  // true nếu chạy https
    private boolean cookieSecure;

    @Value("${uts.cookie.access-ttl-seconds:900}")        // 15 phút
    private long accessTtlSeconds;

    @Value("${uts.cookie.refresh-enabled:false}")         // bật nếu có refresh token
    private boolean refreshEnabled;

    @Value("${uts.cookie.refresh-ttl-seconds:2592000}")   // 30 ngày
    private long refreshTtlSeconds;

    public GoogleOAuth2SuccessHandler(UserApplicationService userApp, TokenService tokens) {
        this.userApp = userApp;
        this.tokens = tokens;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
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

            // 1) Issue access token (không chứa org/project context)
            var accessToken = tokens.issueAccessToken(result.userId(), result.email(), null, Set.of());

            // 2) (tuỳ chọn) issue refresh token
            String refreshToken = null;
            if (refreshEnabled) {
                refreshToken = tokens.issueAccessToken(result.userId(), result.email(), null, Set.of());
            }

            // 3) Set HttpOnly cookies
            addCookie(response, "uts_at", accessToken, (int) accessTtlSeconds, cookieSecure, cookieDomain, true);
            if (refreshEnabled && refreshToken != null) {
                addCookie(response, "uts_rt", refreshToken, (int) refreshTtlSeconds, cookieSecure, cookieDomain, true);
            }

            // 4) Redirect về auth-web (mặc định tới trang chọn workspace)
            //    Có thể đọc "state" / saved request để quay về URL ban đầu nếu cần.
            String target = authWebUrl.endsWith("/")
                    ? authWebUrl + "workspaces"
                    : authWebUrl + "/workspaces";
            response.sendRedirect(target);

        } catch (IllegalStateException exSync) {
            // Giữ thông báo lỗi tối giản, không lộ thông tin nhạy cảm
            String target = (authWebUrl.endsWith("/") ? authWebUrl : authWebUrl + "/") +
                    "login?error=google_sync_not_allowed";
            response.sendRedirect(target);
        }
    }

    /**
     * Helper set cookie với SameSite=Lax, HttpOnly; không set Domain khi là "localhost".
     */
    private static void addCookie(HttpServletResponse response, String name, String value,
                                  int maxAgeSeconds, boolean secure, String domain, boolean httpOnly) {

        // javax.servlet Cookie chưa hỗ trợ SameSite -> set header thủ công để có SameSite=Lax
        Cookie c = new Cookie(name, value);
        c.setPath("/");
        c.setMaxAge(maxAgeSeconds);
        c.setHttpOnly(httpOnly);
        c.setSecure(secure);

        // Lưu ý: KHÔNG set Domain=localhost (bị bỏ qua). Chỉ set khi khác "localhost".
        if (domain != null && !domain.isBlank() && !"localhost".equalsIgnoreCase(domain)) {
            c.setDomain(domain);
        }

        // Ghi cơ bản trước
        response.addCookie(c);

        // Ghi đè SameSite=Lax (chuẩn cho SSO cross-subdomain mà vẫn an toàn)
        // Lấy cookie header cuối cùng và thêm SameSite
        // Một cách chắc chắn hơn: set thẳng header "Set-Cookie" tuỳ trình duyệt.
        StringBuilder header = new StringBuilder()
                .append(name).append("=").append(value)
                .append("; Path=/")
                .append("; Max-Age=").append(maxAgeSeconds)
                .append(secure ? "; Secure" : "")
                .append(httpOnly ? "; HttpOnly" : "")
                .append("; SameSite=Lax");

        if (domain != null && !domain.isBlank() && !"localhost".equalsIgnoreCase(domain)) {
            header.append("; Domain=").append(domain);
        }

        response.addHeader("Set-Cookie", header.toString());
    }
}