package tn.esprit.usermicroservice.integration.keycloak;

/**
 * Minimal user view used for syncing Keycloak realm users into the local DB.
 */
public record KeycloakUser(
        String id,
        String email,
        String name,
        String role
) {
}
