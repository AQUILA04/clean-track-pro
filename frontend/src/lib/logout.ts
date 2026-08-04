import { FEDERATED_LOGOUT_PATH } from '@/lib/auth-urls';

/** Redirects to federated logout (Keycloak + NextAuth session cleared). */
export function logout(): void {
    window.location.replace(FEDERATED_LOGOUT_PATH);
}
