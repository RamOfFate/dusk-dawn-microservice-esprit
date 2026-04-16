package fate.ram.apigateway.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimValidator;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(auth -> auth
                        // Infra / health
                        .requestMatchers("/actuator/health", "/actuator/health/**").permitAll()
                        .requestMatchers("/health/**").permitAll()

                        // Public catalog endpoints (UX-first)
                        .requestMatchers(HttpMethod.GET, "/api/books/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/categories/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/books/popular").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/books/ping").permitAll()

                        // Public search
                        .requestMatchers(HttpMethod.GET, "/search/**").permitAll()

                        // Public reviews (browse)
                        .requestMatchers(HttpMethod.GET, "/reviews/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/review-service/**").permitAll()

                        // Admin-only management endpoints
                        .requestMatchers("/users/**").hasRole("admin")
                        .requestMatchers("/index/**").hasRole("admin")

                        // Admin-only mutations on catalog
                        .requestMatchers(HttpMethod.POST, "/api/**").hasRole("admin")
                        .requestMatchers(HttpMethod.PUT, "/api/**").hasRole("admin")
                        .requestMatchers(HttpMethod.PATCH, "/api/**").hasRole("admin")
                        .requestMatchers(HttpMethod.DELETE, "/api/**").hasRole("admin")

                        // Everything else requires login (customer/admin)
                        .anyRequest().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(SecurityConfig::jwtAuthenticationToken))
                );

        return http.build();
    }

    /**
     * Keycloak in Docker is reachable by services as http://keycloak:8081, while the browser uses
     * http://localhost:8081. Depending on how the token is obtained, the JWT `iss` can differ.
     *
     * We accept both issuers for dev, while still validating signature + timestamps.
     */
    @Bean
    JwtDecoder jwtDecoder(@Value("${spring.security.oauth2.resourceserver.jwt.jwk-set-uri}") String jwkSetUri) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(jwkSetUri).build();

        List<String> allowedIssuers = List.of(
                "http://localhost:8081/realms/bookshop",
                "http://keycloak:8081/realms/bookshop"
        );

        OAuth2TokenValidator<Jwt> timestamp = new JwtTimestampValidator();
        OAuth2TokenValidator<Jwt> issuer = new JwtClaimValidator<>("iss", iss -> iss instanceof String s && allowedIssuers.contains(s));

        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(timestamp, issuer));
        return decoder;
    }

    /**
     * Keycloak puts realm roles under: realm_access.roles
     * We map them to Spring Security authorities: ROLE_<role>
     */
    private static JwtAuthenticationToken jwtAuthenticationToken(Jwt jwt) {
        JwtGrantedAuthoritiesConverter scopesConverter = new JwtGrantedAuthoritiesConverter();
        scopesConverter.setAuthorityPrefix("SCOPE_");

        Collection<GrantedAuthority> authorities = new ArrayList<>();
        Collection<GrantedAuthority> scopeAuthorities = scopesConverter.convert(jwt);
        if (scopeAuthorities != null) {
            authorities.addAll(scopeAuthorities);
        }

        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        if (realmAccess != null) {
            Object rolesObj = realmAccess.get("roles");
            if (rolesObj instanceof Collection<?> roles) {
                for (Object role : roles) {
                    if (role instanceof String r && !r.isBlank()) {
                        authorities.add(new SimpleGrantedAuthority("ROLE_" + r));
                    }
                }
            }
        }

        String principalName = jwt.getClaimAsString("preferred_username");
        if (principalName == null || principalName.isBlank()) {
            principalName = jwt.getSubject();
        }

        return new JwtAuthenticationToken(jwt, authorities, principalName);
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cors = new CorsConfiguration();
        cors.setAllowedOrigins(List.of(
                "http://localhost:3000",
                "http://127.0.0.1:3000"
        ));
        cors.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        cors.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "Origin"));
        cors.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cors);
        return source;
    }
}
