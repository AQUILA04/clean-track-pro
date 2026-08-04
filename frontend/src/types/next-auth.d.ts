import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
    interface Session {
        accessToken?: string;
        id_token?: string;
        error?: 'RefreshAccessTokenError' | 'TenantDeactivated';
        user: {
            id?: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
            tenant_id?: string;
            site_id?: string;
            site_ids?: string[];
            role?: string;
            roles?: string[];
        };
    }

    interface User {
        tenant_id?: string;
        site_ids?: string[];
        role?: string;
        roles?: string[];
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        tenant_id?: string;
        site_ids?: string[];
        role?: string;
        roles?: string[];
        accessToken?: string;
        refreshToken?: string;
        accessTokenExpires?: number;
        error?: 'RefreshAccessTokenError' | 'TenantDeactivated';
        id_token?: string;
    }
}
