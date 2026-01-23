import NextAuth, { NextAuthOptions } from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';

export const authOptions: NextAuthOptions = {
    providers: [
        KeycloakProvider({
            clientId: process.env.KEYCLOAK_CLIENT_ID!,
            clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
            issuer: process.env.KEYCLOAK_ISSUER,
        }),
    ],
    callbacks: {
        async jwt({ token, account, profile }) {
            // Persist tenant_id and roles in JWT token
            if (account && profile) {
                token.tenant_id = (profile as any).tenant_id;
                token.site_ids = (profile as any).site_ids;
                token.roles = (profile as any).realm_access?.roles || [];
            }
            return token;
        },
        async session({ session, token }) {
            // Add custom claims to session
            if (session.user) {
                (session.user as any).tenant_id = token.tenant_id;
                (session.user as any).site_ids = token.site_ids;
                (session.user as any).roles = token.roles;
            }
            return session;
        },
    },
    pages: {
        signIn: '/auth/signin',
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
