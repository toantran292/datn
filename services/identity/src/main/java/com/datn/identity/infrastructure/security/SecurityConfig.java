package com.datn.identity.infrastructure.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AnonymousAuthenticationFilter;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.IOException;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

@Configuration
public class SecurityConfig {

    @Value("${cors.allowed-origins:*}")
    private String[] allowedOrigins;

    @Value("${cors.allowed-methods:GET,POST,PUT,DELETE,OPTIONS}")
    private String[] allowedMethods;

    @Value("${cors.allowed-headers:*}")
    private String[] allowedHeaders;

    @Value("${cors.allow-credentials:true}")
    private boolean allowCredentials;

    @Autowired
    private JwtDecoder jwtDecoder;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Sử dụng setAllowedOrigins thay vì setAllowedOriginPatterns cho các URL cụ thể
        configuration.setAllowedOrigins(Arrays.asList(allowedOrigins));
        configuration.setAllowedMethods(Arrays.asList(allowedMethods));
        configuration.setAllowedHeaders(Arrays.asList(allowedHeaders));
        configuration.setAllowCredentials(allowCredentials);
        configuration.setExposedHeaders(Arrays.asList("Authorization", "X-User-ID", "X-Org-ID", "Content-Type"));

        // Thêm max age để cache preflight requests
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(@NonNull CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOrigins(allowedOrigins)
                        .allowedMethods(allowedMethods)
                        .allowedHeaders(allowedHeaders)
                        .allowCredentials(allowCredentials)
                        .exposedHeaders("Authorization", "X-User-ID", "X-Org-ID", "Content-Type")
                        .maxAge(3600);
            }
        };
    }

    @Bean
    @Order(1)
    SecurityFilterChain oauth2Chain(HttpSecurity http, AuthenticationSuccessHandler googleSuccess) throws Exception {
        http
                .securityMatcher("/login/**", "/oauth2/**")
                .authorizeHttpRequests(a -> a.anyRequest().permitAll())
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .oauth2Login(o -> o.successHandler(googleSuccess))
                .exceptionHandling(e -> e.authenticationEntryPoint(plain401()));
        return http.build();
    }

    @Bean
    @Order(2)
    SecurityFilterChain apiChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/.well-known/jwks.json").permitAll()
                        .requestMatchers(HttpMethod.POST, "/auth/token").permitAll()
                        .requestMatchers(HttpMethod.POST, "/auth/register").permitAll()
                        .requestMatchers(HttpMethod.POST, "/invitations/accept").permitAll()
                        .requestMatchers("/actuator/**").permitAll()
                        .requestMatchers("/internal/**").permitAll() // Allow internal service-to-service calls
                        .requestMatchers(HttpMethod.POST, "/auth/password/set").authenticated()
                        .anyRequest().authenticated())
                .httpBasic(AbstractHttpConfigurer::disable)
                .addFilterBefore(new CookieAuthFilter(jwtDecoder), AnonymousAuthenticationFilter.class)
                .addFilterBefore(new InternalCallBypassFilter(), AnonymousAuthenticationFilter.class)
                .exceptionHandling(e -> e.authenticationEntryPoint(plain401()));

        return http.build();
    }

    static AuthenticationEntryPoint plain401() {
        return (req, res, ex) -> res.sendError(HttpServletResponse.SC_UNAUTHORIZED);
    }

    static class InternalCallBypassFilter extends OncePerRequestFilter {
        @Override
        protected void doFilterInternal(@NonNull HttpServletRequest request,
                @NonNull HttpServletResponse response,
                @NonNull FilterChain filterChain)
                throws ServletException, IOException {

            String internal = request.getHeader("X-Internal-Call");

            if ("bff".equals(internal)) {

                // Tạo một user SYSTEM giả
                String systemUserId = "00000000-0000-0000-0000-000000000001";

                var auth = new UsernamePasswordAuthenticationToken(
                        systemUserId,
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_SYSTEM")));

                var details = new SecurityConfig.UserAuthDetails(
                        systemUserId,
                        "system@internal",
                        null,
                        List.of("SYSTEM"));

                auth.setDetails(details);

                SecurityContextHolder.getContext().setAuthentication(auth);
            }

            filterChain.doFilter(request, response);
        }
    }

    static class CookieAuthFilter extends OncePerRequestFilter {
        private final JwtDecoder jwtDecoder;

        public CookieAuthFilter(JwtDecoder jwtDecoder) {
            this.jwtDecoder = jwtDecoder;
        }

        @Override
        protected void doFilterInternal(@NonNull HttpServletRequest req,
                @NonNull HttpServletResponse res,
                @NonNull FilterChain chain) throws ServletException, IOException {

            // Skip authentication if already authenticated
            if (SecurityContextHolder.getContext().getAuthentication() != null) {
                chain.doFilter(req, res);
                return;
            }

            // Extract access token from cookies
            String accessToken = extractTokenFromCookies(req);

            if (accessToken != null) {
                try {
                    // Decode and validate JWT token
                    Jwt jwt = jwtDecoder.decode(accessToken);

                    // Extract user information from JWT claims
                    String userId = jwt.getSubject();
                    String email = jwt.getClaimAsString("email");
                    String orgId = jwt.getClaimAsString("org_id");

                    // Extract roles from JWT claims
                    Collection<String> roles = jwt.getClaimAsStringList("roles");
                    List<SimpleGrantedAuthority> authorities = roles != null ? roles.stream()
                            .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                            .collect(Collectors.toList()) : List.of();

                    // Create authentication token with user details
                    var auth = new UsernamePasswordAuthenticationToken(userId, null, authorities);

                    // Add additional user info as details
                    var userDetails = new UserAuthDetails(userId, email, orgId, roles);
                    auth.setDetails(userDetails);

                    // Set authentication in security context
                    SecurityContextHolder.getContext().setAuthentication(auth);

                    // Add user info to request headers for downstream services
                    if (userId != null) {
                        req.setAttribute("X-User-ID", userId);
                    }
                    if (orgId != null) {
                        req.setAttribute("X-Org-ID", orgId);
                    }

                } catch (JwtException e) {
                    // Invalid token - continue without authentication
                    // Log the error for debugging
                    System.err.println("Invalid JWT token: " + e.getMessage());
                }
            }

            chain.doFilter(req, res);
        }

        private String extractTokenFromCookies(HttpServletRequest request) {
            if (request.getCookies() != null) {
                for (Cookie cookie : request.getCookies()) {
                    if ("uts_at".equals(cookie.getName())) {
                        return cookie.getValue();
                    }
                }
            }
            return null;
        }
    }

    // Helper class to store user authentication details
    static class UserAuthDetails {
        private final String userId;
        private final String email;
        private final String orgId;
        private final Collection<String> roles;

        public UserAuthDetails(String userId, String email, String orgId, Collection<String> roles) {
            this.userId = userId;
            this.email = email;
            this.orgId = orgId;
            this.roles = roles;
        }

        public String getUserId() {
            return userId;
        }

        public String getEmail() {
            return email;
        }

        public String getOrgId() {
            return orgId;
        }

        public Collection<String> getRoles() {
            return roles;
        }
    }
}