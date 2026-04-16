package tn.esprit.usermicroservice.integration.keycloak;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

/**
 * Small Keycloak Admin API client.
 *
 * For class projects we keep it simple by using the bootstrap admin user (master realm)
 * to call the Admin API and then sync users into the local DB.
 */
@Service
public class KeycloakAdminClient {

    private final RestClient rest;

    private final String baseUrl;
    private final String authRealm;
    private final String targetRealm;
    private final String username;
    private final String password;
    private final String clientId;

    private volatile String cachedToken;
    private volatile Instant cachedTokenExpiresAt;

    public KeycloakAdminClient(
            RestClient.Builder restClientBuilder,
            @Value("${keycloak.admin.base-url:http://keycloak:8081}") String baseUrl,
            @Value("${keycloak.admin.auth-realm:master}") String authRealm,
            @Value("${keycloak.admin.target-realm:bookshop}") String targetRealm,
            @Value("${keycloak.admin.username:admin}") String username,
            @Value("${keycloak.admin.password:admin}") String password,
            @Value("${keycloak.admin.client-id:admin-cli}") String clientId
    ) {
        this.rest = restClientBuilder.build();
        this.baseUrl = stripTrailingSlash(baseUrl);
        this.authRealm = authRealm;
        this.targetRealm = targetRealm;
        this.username = username;
        this.password = password;
        this.clientId = clientId;
    }

    // -------------------- Public API --------------------

    public List<KeycloakUser> listUsers() {
        List<KeycloakUserRepresentation> reps = getUsers(0, 1000);
        List<KeycloakUser> out = new ArrayList<>(reps.size());

        for (KeycloakUserRepresentation u : reps) {
            if (u == null || u.id() == null) continue;

            String email = u.email();
            String name = displayName(u);

            // Determine role (admin/customer) from realm roles.
            List<String> roles = getRealmRoleNames(u.id());
            String role = resolveRole(roles);

            out.add(new KeycloakUser(u.id(), email, name, role));
        }

        return out;
    }

    public String findUserIdByEmail(String email) {
        if (email == null || email.isBlank()) return null;

        String url = UriComponentsBuilder
                .fromHttpUrl(baseUrl + "/admin/realms/" + targetRealm + "/users")
                .queryParam("email", email)
                .queryParam("exact", true)
                .build()
                .toUriString();

        List<KeycloakUserRepresentation> users = rest.get()
                .uri(url)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token())
                .retrieve()
                .body(new ParameterizedTypeReference<>() {
                });

        if (users == null || users.isEmpty()) return null;
        return users.get(0).id();
    }

    public String createUser(String email, String fullName, String rawPassword, String role) {
        Objects.requireNonNull(email, "email");
        Objects.requireNonNull(rawPassword, "rawPassword");

        NameParts parts = splitName(fullName);

        Map<String, Object> payload = new HashMap<>();
        payload.put("username", email);
        payload.put("email", email);
        payload.put("enabled", true);
        payload.put("emailVerified", true);
        payload.put("firstName", parts.firstName());
        payload.put("lastName", parts.lastName());

        // NOTE: On newer Keycloak versions, including "credentials" in the create-user payload
        // may be ignored. To ensure the password is actually set, we always call reset-password
        // after we obtain the created user id.

        String url = baseUrl + "/admin/realms/" + targetRealm + "/users";

        ResponseEntity<Void> resp = rest.post()
                .uri(url)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token())
                .contentType(MediaType.APPLICATION_JSON)
                .body(payload)
                .retrieve()
                .toBodilessEntity();

        String location = resp.getHeaders().getFirst(HttpHeaders.LOCATION);
        String id = extractIdFromLocation(location);
        if (id == null) {
            // Fallback: re-find by email.
            id = findUserIdByEmail(email);
        }

        if (id == null) {
            throw new IllegalStateException("Keycloak user created but id not found");
        }

        resetPassword(id, rawPassword);
        setSingleRealmRole(id, role);
        return id;
    }

    public void updateUser(String userId, String email, String fullName, String role) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("userId is required");
        }

        NameParts parts = splitName(fullName);

        Map<String, Object> payload = new HashMap<>();
        if (email != null && !email.isBlank()) {
            payload.put("username", email);
            payload.put("email", email);
        }
        payload.put("firstName", parts.firstName());
        payload.put("lastName", parts.lastName());
        payload.put("enabled", true);

        String url = baseUrl + "/admin/realms/" + targetRealm + "/users/" + userId;

        rest.put()
                .uri(url)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token())
                .contentType(MediaType.APPLICATION_JSON)
                .body(payload)
                .retrieve()
                .toBodilessEntity();

        setSingleRealmRole(userId, role);
    }

    public void resetPassword(String userId, String rawPassword) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("userId is required");
        }
        if (rawPassword == null || rawPassword.isBlank()) {
            return;
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "password");
        payload.put("value", rawPassword);
        payload.put("temporary", false);

        String url = baseUrl + "/admin/realms/" + targetRealm + "/users/" + userId + "/reset-password";

        rest.put()
                .uri(url)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token())
                .contentType(MediaType.APPLICATION_JSON)
                .body(payload)
                .retrieve()
                .toBodilessEntity();
    }

    public void deleteUser(String userId) {
        if (userId == null || userId.isBlank()) {
            return;
        }

        String url = baseUrl + "/admin/realms/" + targetRealm + "/users/" + userId;

        rest.delete()
                .uri(url)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token())
                .retrieve()
                .toBodilessEntity();
    }

    // -------------------- Internals --------------------

    private List<KeycloakUserRepresentation> getUsers(int first, int max) {
        String url = UriComponentsBuilder
                .fromHttpUrl(baseUrl + "/admin/realms/" + targetRealm + "/users")
                .queryParam("first", first)
                .queryParam("max", max)
                .build()
                .toUriString();

        List<KeycloakUserRepresentation> users = rest.get()
                .uri(url)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token())
                .retrieve()
                .body(new ParameterizedTypeReference<>() {
                });

        return users != null ? users : List.of();
    }

    private List<String> getRealmRoleNames(String userId) {
        String url = baseUrl + "/admin/realms/" + targetRealm + "/users/" + userId + "/role-mappings/realm";

        List<KeycloakRoleRepresentation> roles = rest.get()
                .uri(url)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token())
                .retrieve()
                .body(new ParameterizedTypeReference<>() {
                });

        if (roles == null) return List.of();
        return roles.stream()
                .filter(Objects::nonNull)
                .map(KeycloakRoleRepresentation::name)
                .filter(Objects::nonNull)
                .toList();
    }

    private void setSingleRealmRole(String userId, String desiredRole) {
        String role = desiredRole != null && !desiredRole.isBlank() ? desiredRole : "customer";

        // Remove admin/customer if present and different.
        List<KeycloakRoleRepresentation> current = getRealmRoles(userId);
        List<KeycloakRoleRepresentation> toRemove = current.stream()
                .filter(r -> r != null && r.name() != null)
                .filter(r -> isManagedRole(r.name()) && !r.name().equalsIgnoreCase(role))
                .toList();

        if (!toRemove.isEmpty()) {
            String url = baseUrl + "/admin/realms/" + targetRealm + "/users/" + userId + "/role-mappings/realm";

            rest.method(HttpMethod.DELETE)
                    .uri(url)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(toRemove)
                    .retrieve()
                    .toBodilessEntity();
        }

        boolean alreadyHas = current.stream().anyMatch(r -> r != null && r.name() != null && r.name().equalsIgnoreCase(role));
        if (!alreadyHas) {
            KeycloakRoleRepresentation rep = getRole(role);
            String url = baseUrl + "/admin/realms/" + targetRealm + "/users/" + userId + "/role-mappings/realm";

            rest.post()
                    .uri(url)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(List.of(rep))
                    .retrieve()
                    .toBodilessEntity();
        }
    }

    private List<KeycloakRoleRepresentation> getRealmRoles(String userId) {
        String url = baseUrl + "/admin/realms/" + targetRealm + "/users/" + userId + "/role-mappings/realm";

        List<KeycloakRoleRepresentation> roles = rest.get()
                .uri(url)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token())
                .retrieve()
                .body(new ParameterizedTypeReference<>() {
                });

        return roles != null ? roles : List.of();
    }

    private KeycloakRoleRepresentation getRole(String roleName) {
        String url = baseUrl + "/admin/realms/" + targetRealm + "/roles/" + roleName;

        return rest.get()
                .uri(url)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token())
                .retrieve()
                .body(KeycloakRoleRepresentation.class);
    }

    private String resolveRole(List<String> roles) {
        if (roles == null) return "customer";
        for (String r : roles) {
            if (r == null) continue;
            if (r.equalsIgnoreCase("admin")) return "admin";
        }
        for (String r : roles) {
            if (r == null) continue;
            if (r.equalsIgnoreCase("customer")) return "customer";
        }
        return "customer";
    }

    private static boolean isManagedRole(String roleName) {
        if (roleName == null) return false;
        String r = roleName.toLowerCase(Locale.ROOT);
        return r.equals("admin") || r.equals("customer");
    }

    private static String displayName(KeycloakUserRepresentation u) {
        String first = u.firstName() != null ? u.firstName().trim() : "";
        String last = u.lastName() != null ? u.lastName().trim() : "";
        String full = (first + " " + last).trim();
        if (!full.isBlank()) return full;

        if (u.username() != null && !u.username().isBlank()) return u.username();
        if (u.email() != null && !u.email().isBlank()) return u.email();
        return "";
    }

    private String token() {
        Instant now = Instant.now();
        String t = cachedToken;
        Instant exp = cachedTokenExpiresAt;

        if (t != null && exp != null && now.isBefore(exp.minusSeconds(15))) {
            return t;
        }

        synchronized (this) {
            now = Instant.now();
            t = cachedToken;
            exp = cachedTokenExpiresAt;
            if (t != null && exp != null && now.isBefore(exp.minusSeconds(15))) {
                return t;
            }

            TokenResponse token = fetchToken();
            cachedToken = token.access_token();
            cachedTokenExpiresAt = now.plusSeconds(Math.max(token.expires_in(), 30));
            return cachedToken;
        }
    }

    private TokenResponse fetchToken() {
        String url = baseUrl + "/realms/" + authRealm + "/protocol/openid-connect/token";

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "password");
        form.add("client_id", clientId);
        form.add("username", username);
        form.add("password", password);

        try {
            return rest.post()
                    .uri(url)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(form)
                    .retrieve()
                    .body(TokenResponse.class);
        } catch (RestClientException ex) {
            throw new IllegalStateException("Failed to get Keycloak admin token from " + url, ex);
        }
    }

    private static String extractIdFromLocation(String location) {
        if (location == null || location.isBlank()) return null;
        int idx = location.lastIndexOf('/');
        if (idx < 0 || idx == location.length() - 1) return null;
        return location.substring(idx + 1);
    }

    private static String stripTrailingSlash(String value) {
        if (value == null) return "";
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    private static NameParts splitName(String fullName) {
        if (fullName == null) {
            return new NameParts("", "");
        }
        String trimmed = fullName.trim();
        if (trimmed.isBlank()) {
            return new NameParts("", "");
        }
        String[] parts = trimmed.split("\\s+", 2);
        if (parts.length == 1) {
            return new NameParts(parts[0], "");
        }
        return new NameParts(parts[0], parts[1]);
    }

    private record TokenResponse(String access_token, long expires_in) {
    }

    private record NameParts(String firstName, String lastName) {
    }

    private record KeycloakUserRepresentation(
            String id,
            String username,
            String email,
            String firstName,
            String lastName,
            Boolean enabled
    ) {
    }

    private record KeycloakRoleRepresentation(
            String id,
            String name
    ) {
    }
}
