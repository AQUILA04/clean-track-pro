import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
    const token = await getToken({ req });
    const idToken = token?.id_token;

    if (!idToken) {
        // Fallback if no id_token available: simple redirect to home
        return NextResponse.redirect(new URL("/", req.url));
    }

    const issuerUrl = process.env.KEYCLOAK_ISSUER;
    const postLogoutRedirectUri = encodeURIComponent(process.env.NEXTAUTH_URL || req.nextUrl.origin);

    // Keycloak OIDC logout endpoint
    const logoutUrl = `${issuerUrl}/protocol/openid-connect/logout?id_token_hint=${idToken}&post_logout_redirect_uri=${postLogoutRedirectUri}`;

    return NextResponse.redirect(logoutUrl);
}
