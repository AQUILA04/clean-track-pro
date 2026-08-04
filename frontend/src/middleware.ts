import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { canAccessPath } from '@/lib/route-access';

export default withAuth(
    function middleware(req) {
        const roles = (req.nextauth.token?.roles as string[] | undefined) ?? [];
        const role = req.nextauth.token?.role as string | undefined;
        const effectiveRoles = role && !roles.includes(role) ? [...roles, role] : roles;
        const pathname = req.nextUrl.pathname;

        if (!canAccessPath(effectiveRoles, pathname)) {
            const url = req.nextUrl.clone();
            url.pathname = '/dashboard';
            url.search = '';
            return NextResponse.redirect(url);
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
    },
);

export const config = {
    matcher: [
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
