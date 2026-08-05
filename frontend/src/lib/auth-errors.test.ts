import {
    AUTH_SESSION_EXPIRED_MESSAGE,
    resolveAuthErrorMessage,
    shouldBlockAuthRedirect,
} from './auth-errors';

describe('resolveAuthErrorMessage', () => {
    it('maps authentication_expired description', () => {
        expect(
            resolveAuthErrorMessage('temporarily_unavailable', 'authentication_expired'),
        ).toBe(AUTH_SESSION_EXPIRED_MESSAGE);
    });

    it('maps OAuthCallback to session expired guidance', () => {
        expect(resolveAuthErrorMessage('OAuthCallback', null)).toBe(AUTH_SESSION_EXPIRED_MESSAGE);
    });

    it('returns null when no error', () => {
        expect(resolveAuthErrorMessage(null, null)).toBeNull();
    });

    it('maps AccessDenied', () => {
        expect(resolveAuthErrorMessage('AccessDenied', null)).toMatch(/refusé/i);
    });
});

describe('shouldBlockAuthRedirect', () => {
    it('blocks when error param present', () => {
        expect(shouldBlockAuthRedirect('OAuthCallback', null)).toBe(true);
    });

    it('blocks when flash message present', () => {
        expect(shouldBlockAuthRedirect(null, 'flash')).toBe(true);
    });

    it('allows redirect when clean', () => {
        expect(shouldBlockAuthRedirect(null, null)).toBe(false);
    });
});
