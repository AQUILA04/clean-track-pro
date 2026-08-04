import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import { authOptions } from '@/lib/auth-options';
import {
    clearAllAuthCookies,
    getAuthJwtOptions,
    getPostLogoutRedirectUrl,
} from '@/lib/auth-cookies';

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    const token = await getToken({ req, ...getAuthJwtOptions(req) });

    const idToken = session?.id_token ?? (token?.id_token as string | undefined);
    const landingUrl = `${getPostLogoutRedirectUrl(req)}/?signedOut=1`;
    const issuerUrl = process.env.KEYCLOAK_ISSUER;
    const clientId = process.env.KEYCLOAK_CLIENT_ID;

    let targetUrl = landingUrl;

    if (idToken && issuerUrl) {
        const params = new URLSearchParams({
            id_token_hint: idToken,
            post_logout_redirect_uri: landingUrl,
        });

        if (clientId) {
            params.set('client_id', clientId);
        }

        targetUrl = `${issuerUrl}/protocol/openid-connect/logout?${params.toString()}`;
    }

    const response = NextResponse.redirect(targetUrl);
    return clearAllAuthCookies(req, response);
}
