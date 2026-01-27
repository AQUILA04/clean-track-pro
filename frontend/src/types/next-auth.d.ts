import 'next-auth';

declare module 'next-auth' {
    interface Session {
        accessToken?: string;
        user: {
            id?: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
            tenant_id?: string;
            site_ids?: string[];
            roles?: string[];
        };
    }

    interface User {
        tenant_id?: string;
        site_ids?: string[];
        roles?: string[];
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        tenant_id?: string;
        site_ids?: string[];
        roles?: string[];
    }
}
