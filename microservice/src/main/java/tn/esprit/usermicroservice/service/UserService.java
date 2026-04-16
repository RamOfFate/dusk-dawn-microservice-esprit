package tn.esprit.usermicroservice.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.usermicroservice.integration.keycloak.KeycloakAdminClient;
import tn.esprit.usermicroservice.integration.keycloak.KeycloakUser;
import tn.esprit.usermicroservice.model.User;
import tn.esprit.usermicroservice.repository.UserRepository;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final KeycloakAdminClient keycloak;

    public UserService(UserRepository userRepository, KeycloakAdminClient keycloak) {
        this.userRepository = userRepository;
        this.keycloak = keycloak;
    }

    /**
     * Sync Keycloak users into the local DB projection, then return the local list.
     */
    @Transactional
    public List<User> getAllUsers() {
        syncFromKeycloak();
        return userRepository.findAll();
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    /**
     * Create user in Keycloak (source of truth), then upsert in local DB.
     */
    @Transactional
    public User createUser(User user) {
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (user.getName() == null || user.getName().isBlank()) {
            throw new IllegalArgumentException("Name is required");
        }
        if (user.getPassword() == null || user.getPassword().isBlank()) {
            throw new IllegalArgumentException("Password is required");
        }

        String kcId = keycloak.createUser(user.getEmail(), user.getName(), user.getPassword(), normalizeRole(user.getRole()));

        User saved = upsertFromKeycloak(new KeycloakUser(
                kcId,
                user.getEmail(),
                user.getName(),
                normalizeRole(user.getRole())
        ));

        // Do not store actual password locally.
        saved.setPassword("");
        return userRepository.save(saved);
    }

    /**
     * Update user in Keycloak then local.
     */
    @Transactional
    public User updateUser(Long id, User updatedUser) {
        User existing = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String role = normalizeRole(updatedUser.getRole() != null ? updatedUser.getRole() : existing.getRole());
        String name = updatedUser.getName() != null ? updatedUser.getName() : existing.getName();
        String email = updatedUser.getEmail() != null ? updatedUser.getEmail() : existing.getEmail();

        if (existing.getKeycloakId() == null || existing.getKeycloakId().isBlank()) {
            // This row likely predates Keycloak sync.
            // 1) Try to link to an existing Keycloak user.
            // IMPORTANT: if email is being changed, Keycloak still has the *old* email at this moment.
            String linkedId = keycloak.findUserIdByEmail(existing.getEmail());
            if ((linkedId == null || linkedId.isBlank()) && email != null && !email.isBlank() && (existing.getEmail() == null || !email.equalsIgnoreCase(existing.getEmail()))) {
                linkedId = keycloak.findUserIdByEmail(email);
            }

            // 2) If still not found, create it in Keycloak (only possible if a password is provided in this update request).
            if (linkedId == null || linkedId.isBlank()) {
                if (updatedUser.getPassword() == null || updatedUser.getPassword().isBlank()) {
                    throw new IllegalStateException("Local user id=" + id + " has no keycloakId and no Keycloak user was found by email. Provide a password to create it in Keycloak.");
                }
                linkedId = keycloak.createUser(email, name, updatedUser.getPassword(), role);
            }

            existing.setKeycloakId(linkedId);
        }

        keycloak.updateUser(existing.getKeycloakId(), email, name, role);
        if (updatedUser.getPassword() != null && !updatedUser.getPassword().isBlank()) {
            keycloak.resetPassword(existing.getKeycloakId(), updatedUser.getPassword());
        }

        existing.setEmail(email);
        existing.setName(name);
        existing.setRole(role);
        existing.setPassword("");
        return userRepository.save(existing);
    }

    @Transactional
    public void deleteUser(Long id) {
        User existing = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String kcId = existing.getKeycloakId();
        if (kcId == null || kcId.isBlank()) {
            kcId = keycloak.findUserIdByEmail(existing.getEmail());
        }
        if (kcId != null && !kcId.isBlank()) {
            keycloak.deleteUser(kcId);
        }

        userRepository.delete(existing);
    }

    private void syncFromKeycloak() {
        List<KeycloakUser> kcUsers = keycloak.listUsers();
        for (KeycloakUser kc : kcUsers) {
            if (kc.email() == null || kc.email().isBlank()) {
                continue;
            }
            upsertFromKeycloak(kc);
        }
    }

    private User upsertFromKeycloak(KeycloakUser kc) {
        Optional<User> byKc = (kc.id() != null && !kc.id().isBlank())
                ? userRepository.findByKeycloakId(kc.id())
                : Optional.empty();

        User u = byKc.orElseGet(() -> userRepository.findByEmail(kc.email()).orElseGet(User::new));

        u.setKeycloakId(kc.id());
        u.setEmail(kc.email());
        u.setName(kc.name() != null && !kc.name().isBlank() ? kc.name() : kc.email());
        u.setRole(normalizeRole(kc.role()));

        if (u.getPassword() == null) {
            u.setPassword("");
        }

        return userRepository.save(u);
    }

    private static String normalizeRole(String role) {
        if (role == null || role.isBlank()) {
            return "customer";
        }
        String r = role.trim();
        if (r.equalsIgnoreCase("ROLE_admin") || r.equalsIgnoreCase("admin")) {
            return "admin";
        }
        if (r.equalsIgnoreCase("ROLE_customer") || r.equalsIgnoreCase("customer")) {
            return "customer";
        }
        return r;
    }
}
