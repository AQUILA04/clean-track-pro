/** User-facing copy for NextAuth / Keycloak sign-in failures. */

export const AUTH_SESSION_EXPIRED_MESSAGE =
    'Votre session de connexion a expiré. Cela arrive si la page Keycloak est restée ouverte trop longtemps ou si vous avez utilisé le bouton Retour du navigateur.';

export const AUTH_GENERIC_FAILURE_MESSAGE =
    'La connexion n’a pas abouti. Veuillez réessayer.';

const SESSION_EXPIRED_MARKERS = [
    'authentication_expired',
    'temporarily_unavailable',
    'login_timeout',
    'session_expired',
];

function isSessionExpiredDescription(description: string | null | undefined): boolean {
    if (!description) return false;
    const normalized = description.toLowerCase();
    return SESSION_EXPIRED_MARKERS.some((marker) => normalized.includes(marker));
}

/**
 * Maps NextAuth `error` codes and optional OAuth `error_description` to a French message.
 */
export function resolveAuthErrorMessage(
    error: string | null | undefined,
    errorDescription?: string | null,
): string | null {
    if (!error && !errorDescription) {
        return null;
    }

    if (isSessionExpiredDescription(errorDescription) || error === 'authentication_expired') {
        return AUTH_SESSION_EXPIRED_MESSAGE;
    }

    switch (error) {
        case 'TenantDeactivated':
            return null; // handled by tenant-access copy on the sign-in page
        case 'OAuthCallback':
        case 'Callback':
            if (isSessionExpiredDescription(errorDescription)) {
                return AUTH_SESSION_EXPIRED_MESSAGE;
            }
            return AUTH_SESSION_EXPIRED_MESSAGE;
        case 'OAuthSignin':
            return 'Impossible de contacter le service d’authentification. Réessayez dans quelques instants.';
        case 'AccessDenied':
            return 'Accès refusé. Votre compte n’a peut-être pas encore été activé.';
        case 'SessionRequired':
            return 'Veuillez vous connecter pour continuer.';
        case 'RefreshAccessTokenError':
            return AUTH_SESSION_EXPIRED_MESSAGE;
        case 'Configuration':
            return 'Configuration d’authentification incorrecte. Contactez le support.';
        default:
            if (isSessionExpiredDescription(error)) {
                return AUTH_SESSION_EXPIRED_MESSAGE;
            }
            if (errorDescription?.trim()) {
                return AUTH_GENERIC_FAILURE_MESSAGE;
            }
            return error ? AUTH_GENERIC_FAILURE_MESSAGE : null;
    }
}

/** True when the sign-in page must not auto-redirect to Keycloak. */
export function shouldBlockAuthRedirect(
    error: string | null | undefined,
    flash: string | null,
): boolean {
    return Boolean(error || flash);
}
