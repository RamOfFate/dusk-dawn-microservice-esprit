"use client";

import * as React from "react";
import Keycloak from "keycloak-js";

import { env } from "~/env";

type AuthContextValue = {
  initialized: boolean;
  isAuthenticated: boolean;
  username: string | null;
  roles: string[];
  token: string | null;
  login: (redirectUri?: string) => void;
  logout: () => void;
  hasRole: (role: string) => boolean;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

function getRealmRoles(tokenParsed: unknown): string[] {
  if (!tokenParsed || typeof tokenParsed !== "object") return [];

  const realmAccess = (tokenParsed as { realm_access?: unknown }).realm_access;
  if (!realmAccess || typeof realmAccess !== "object") return [];

  const roles = (realmAccess as { roles?: unknown }).roles;
  if (!Array.isArray(roles)) return [];

  const cleaned = roles
    .filter((r): r is string => typeof r === "string")
    .map((r) => r.trim())
    .filter(Boolean)
    // Hide Keycloak built-in/default roles to avoid confusing the UI.
    .filter((r) => r !== "offline_access")
    .filter((r) => r !== "uma_authorization")
    .filter((r) => !r.startsWith("default-roles-"));

  return Array.from(new Set(cleaned));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const keycloakRef = React.useRef<Keycloak | null>(null);

  const [initialized, setInitialized] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [username, setUsername] = React.useState<string | null>(null);
  const [roles, setRoles] = React.useState<string[]>([]);
  const [token, setToken] = React.useState<string | null>(null);

  React.useEffect(() => {
    const url = env.NEXT_PUBLIC_KEYCLOAK_URL ?? "http://localhost:8081";
    const realm = env.NEXT_PUBLIC_KEYCLOAK_REALM ?? "bookshop";
    const clientId = env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID ?? "front";

    const kc = new Keycloak({ url, realm, clientId });
    keycloakRef.current = kc;

    let refreshTimer: number | null = null;

    kc.onAuthSuccess = () => {
      setIsAuthenticated(true);
      setToken(kc.token ?? null);
      setUsername(
        (kc.tokenParsed?.preferred_username as string | undefined) ?? null,
      );
      setRoles(getRealmRoles(kc.tokenParsed));
    };

    kc.onAuthLogout = () => {
      setIsAuthenticated(false);
      setToken(null);
      setUsername(null);
      setRoles([]);
    };

    kc.onTokenExpired = () => {
      void kc.updateToken(30).then((refreshed) => {
        if (refreshed) {
          setToken(kc.token ?? null);
          setRoles(getRealmRoles(kc.tokenParsed));
        }
      });
    };

    void kc
      .init({
        onLoad: "check-sso",
        pkceMethod: "S256",
        checkLoginIframe: false,
      })
      .then((authed) => {
        setInitialized(true);
        setIsAuthenticated(authed);
        setToken(kc.token ?? null);
        setUsername(
          (kc.tokenParsed?.preferred_username as string | undefined) ?? null,
        );
        setRoles(getRealmRoles(kc.tokenParsed));

        refreshTimer = window.setInterval(() => {
          if (!kc.authenticated) return;
          void kc.updateToken(30).then((refreshed) => {
            if (refreshed) {
              setToken(kc.token ?? null);
              setRoles(getRealmRoles(kc.tokenParsed));
              setUsername(
                (kc.tokenParsed?.preferred_username as string | undefined) ??
                  null,
              );
            }
          });
        }, 20_000);
      })
      .catch(() => {
        setInitialized(true);
        setIsAuthenticated(false);
        setToken(null);
        setUsername(null);
        setRoles([]);
      });

    return () => {
      if (refreshTimer != null) window.clearInterval(refreshTimer);
    };
  }, []);

  const login = React.useCallback((redirectUri?: string) => {
    const kc = keycloakRef.current;
    if (!kc) return;
    void kc.login({ redirectUri: redirectUri ?? window.location.href });
  }, []);

  const logout = React.useCallback(() => {
    const kc = keycloakRef.current;
    if (!kc) return;
    void kc.logout({ redirectUri: window.location.origin });
  }, []);

  const hasRole = React.useCallback(
    (role: string) => roles.includes(role),
    [roles],
  );

  const value: AuthContextValue = {
    initialized,
    isAuthenticated,
    username,
    roles,
    token,
    login,
    logout,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
