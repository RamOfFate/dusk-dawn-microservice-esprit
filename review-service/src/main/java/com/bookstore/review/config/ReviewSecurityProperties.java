package com.bookstore.review.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "review.security")
public class ReviewSecurityProperties {

    /**
     * When true, allows {@code X-User-Id} header for authentication when no Bearer token is sent (local/dev only).
     */
    private boolean devHeaderAuth = true;

    public boolean isDevHeaderAuth() {
        return devHeaderAuth;
    }

    public void setDevHeaderAuth(boolean devHeaderAuth) {
        this.devHeaderAuth = devHeaderAuth;
    }
}
