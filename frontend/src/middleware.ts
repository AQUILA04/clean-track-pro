import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { canAccessPath } from '@/lib/route-access';

const PROTECTED_PREFIXES = [
    '/dashboard',
    '/agencies',
    '/catalogue',
    '/users',
    '/orders',
    '/workflow',
    '/storage',
    '/clients',
    '/cash-register',
    '/expenses',
    '/finance',
    '/reports',
    '/settings',
    '/admin',
] as const;

function isProtectedPath(pathname: string): boolean {
    return PROTECTED_PREFIXES.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
}

/** Keycloak OAuth errors on the callback URL → friendly sign-in page (no raw callback URL). */
function redirectOAuthCallbackError(req: NextRequest): NextResponse | null {
    const { pathname, searchParams } = req.nextUrl;
    if (!pathname.startsWith('/api/auth/callback/')) {
        return null;
    }
    const oauthError = searchParams.get('error');
    if (!oauthError) {
        return null;
    }

    const url = req.nextUrl.clone();
    url.pathname = '/auth/signin';
    url.search = '';
    url.searchParams.set('error', oauthError);
    const description = searchParams.get('error_description');
    if (description) {
        url.searchParams.set('error_description', description);
    }
    const callbackUrl = searchParams.get('callbackUrl');
    if (callbackUrl) {
        url.searchParams.set('callbackUrl', callbackUrl);
    }
    return NextResponse.redirect(url);
}

export default withAuth(
    function middleware(req) {
        const oauthRedirect = redirectOAuthCallbackError(req);
        if (oauthRedirect) {
            return oauthRedirect;
        }

        const roles = (req.nextauth.token?.roles as string[] | undefined) ?? [];
        const role = req.nextauth.token?.role as string | undefined;
        const effectiveRoles = role && !roles.includes(role) ? [...roles, role] : roles;
        const pathname = req.nextUrl.pathname;

        if (isProtectedPath(pathname) && !canAccessPath(effectiveRoles, pathname)) {
            const url = req.nextUrl.clone();
            url.pathname = '/dashboard';
            url.search = '';
            return NextResponse.redirect(url);
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                const pathname = req.nextUrl.pathname;
                if (pathname.startsWith('/api/auth/callback/')) {
                    return true;
                }
                if (!isProtectedPath(pathname)) {
                    return true;
                }
                return !!token;
            },
        },
    },
);

export const config = {
    matcher: [
        '/api/auth/callback/:path*',
        '/dashboard',
        '/dashboard/:path*',
        '/agencies',
        '/agencies/:path*',
        '/catalogue',
        '/catalogue/:path*',
        '/users',
        '/users/:path*',
        '/orders',
        '/orders/:path*',
        '/workflow',
        '/workflow/:path*',
        '/storage',
        '/storage/:path*',
        '/clients',
        '/clients/:path*',
        '/cash-register',
        '/cash-register/:path*',
        '/expenses',
        '/expenses/:path*',
        '/finance',
        '/finance/:path*',
        '/reports',
        '/reports/:path*',
        '/settings',
        '/settings/:path*',
        '/admin',
        '/admin/:path*',
    ],
};
