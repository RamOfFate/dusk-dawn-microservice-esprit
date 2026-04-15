package com.bookstore.review.security;

import com.bookstore.review.exception.AuthenticationRequiredException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

@Component
public class SecurityContextFacade {

    public Long requireUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        // Cas 1 : token JWT maison (HS256) — notre filtre custom
        if (auth instanceof AuthenticatedUser au) {
            return au.getUserId();
        }

        // Cas 2 : token Keycloak (RS256) — validé par OAuth2 Resource Server
        // Le "sub" (subject) dans un token Keycloak est un UUID.
        // On utilise son hashCode pour obtenir un Long cohérent pour la démo.
        if (auth instanceof JwtAuthenticationToken jwtAuth) {
            Jwt jwt = jwtAuth.getToken();
            String subject = jwt.getSubject();
            return (long) Math.abs(subject.hashCode());
        }

        throw new AuthenticationRequiredException("Authentication required");
    }
}
