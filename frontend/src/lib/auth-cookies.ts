import type { NextRequest, NextResponse } from 'next/server';

const AUTH_COOKIE_PREFIXES = ['next-auth', '__Secure-next-auth', '__Host-next-auth', 'authjs'];

export function isAuthCookie(name: string): boolean {
    return AUTH_COOKIE_PREFIXES.some((prefix) => name.startsWith(prefix) || name.includes('next-auth'));
}

export function clearAllAuthCookies(req: NextRequest, response: NextResponse): NextResponse {
    const secure = req.nextUrl.protocol === 'https:';

    for (const { name } of req.cookies.getAll()) {
        if (!isAuthCookie(name)) {
            continue;
        }

        response.cookies.set(name, '', {
            path: '/',
            maxAge: 0,
            expires: new Date(0),
            httpOnly: true,
            secure,
            sameSite: 'lax',
        });
    }

    return response;
}

export function getAuthJwtOptions(req: NextRequest) {
    const useSecureCookies =
        process.env.NEXTAUTH_URL?.startsWith('https://') ?? req.nextUrl.protocol === 'https:';

    return {
        secret: process.env.NEXTAUTH_SECRET,
        secureCookie: useSecureCookies,
    };
}

export function getPostLogoutRedirectUrl(req: NextRequest): string {
    const configured = process.env.NEXTAUTH_URL?.replace(/\/$/, '');
    return configured || req.nextUrl.origin;
}
