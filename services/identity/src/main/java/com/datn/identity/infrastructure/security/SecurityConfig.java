package com.datn.identity.infrastructure.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AnonymousAuthenticationFilter;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Configuration
public class SecurityConfig {

    @Bean @Order(1)
    SecurityFilterChain oauth2Chain(HttpSecurity http, AuthenticationSuccessHandler googleSuccess) throws Exception {
        http
                .securityMatcher("/login/**", "/oauth2/**")
                .authorizeHttpRequests(a -> a.anyRequest().permitAll())
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .oauth2Login(o -> o.successHandler(googleSuccess))
                .exceptionHandling(e -> e.authenticationEntryPoint(plain401()));
        return http.build();
    }

    @Bean @Order(2)
    SecurityFilterChain apiChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.GET, "/.well-known/jwks.json").permitAll()
                        .requestMatchers(HttpMethod.POST, "/auth/token").permitAll()
                        .requestMatchers(HttpMethod.POST, "/auth/register").permitAll()
                        .requestMatchers(HttpMethod.POST, "/invitations/accept").permitAll()
                        .requestMatchers("/actuator/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/auth/password/set").authenticated()
                        .anyRequest().authenticated()
                )
                .httpBasic(AbstractHttpConfigurer::disable)
                .addFilterBefore(new HeaderAuthFilter(), AnonymousAuthenticationFilter.class)
                .exceptionHandling(e -> e.authenticationEntryPoint(plain401()));

        return http.build();
    }

    static AuthenticationEntryPoint plain401() {
        return (req, res, ex) -> res.sendError(HttpServletResponse.SC_UNAUTHORIZED);
    }

    static class HeaderAuthFilter extends OncePerRequestFilter {
        @Override
        protected void doFilterInternal(@NonNull HttpServletRequest req,
                                        @NonNull HttpServletResponse res,
                                        @NonNull FilterChain chain) throws ServletException, IOException {
            var userId = req.getHeader("X-User-ID");
            if (userId != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                var auth = new UsernamePasswordAuthenticationToken(userId, null, List.of());
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
            chain.doFilter(req, res);
        }
    }
}