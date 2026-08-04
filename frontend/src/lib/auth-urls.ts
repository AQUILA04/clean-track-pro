/** Server-side redirect target — page auto-triggers Keycloak via signIn() POST. */
export function getSignInPageUrl(callbackUrl = '/dashboard'): string {
    return `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`;
}

export const FEDERATED_LOGOUT_PATH = '/api/auth/federated-logout';
