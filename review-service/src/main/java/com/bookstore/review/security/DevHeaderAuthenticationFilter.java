package com.bookstore.review.security;

import com.bookstore.review.config.ReviewSecurityProperties;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Fills authentication from {@code X-User-Id} when no JWT is present — only when enabled (dev/local).
 */
public class DevHeaderAuthenticationFilter extends OncePerRequestFilter {

    public static final String X_USER_ID = "X-User-Id";

    private final ReviewSecurityProperties securityProperties;

    public DevHeaderAuthenticationFilter(ReviewSecurityProperties securityProperties) {
        this.securityProperties = securityProperties;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        if (securityProperties.isDevHeaderAuth()
                && SecurityContextHolder.getContext().getAuthentication() == null) {
            String raw = request.getHeader(X_USER_ID);
            if (raw != null && !raw.isBlank()) {
                try {
                    Long userId = Long.parseLong(raw.trim());
                    SecurityContextHolder.getContext().setAuthentication(new AuthenticatedUser(userId));
                } catch (NumberFormatException ignored) {
                    // leave unauthenticated; security layer will reject protected routes
                }
            }
        }
        filterChain.doFilter(request, response);
    }
}
