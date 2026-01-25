import { ClientFormValues } from '../lib/validations/client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const ClientService = {
    create: async (data: ClientFormValues) => {
        // In a real app, you would attach the auth token here (e.g. from next-auth session)
        // For now, we assume the API proxy or interceptor handles it, or we simply fetch
        // But since RLS depends on JWT, we MUST send the token.
        // Assuming we have a way to get the token. 
        // Usually via getSession() or a wrapper. 
        // For this implementation, I will just do a standard fetch and assume headers are injected by a clearer/session wrapper 
        // OR I will leave a TODO for Auth integration which likely exists in 'api' folder.

        // Check if there is an existing API utility.
        // I'll stick to native fetch for now, but in production use an axios instance with interceptors.

        // TODO: In a real app, use a proper HTTP client with interceptors
        // For now, we assume the API proxy or interceptor handles it, or we simply fetch
        // But since RLS depends on JWT, we MUST send the token.
        // We will retrieve the token from local storage or session if available, 
        // but since this is a server component/client component mix, let's assume valid session cookie is sent automatically by browser if NextAuth is configured correctly with cookies.
        // HOWEVER, for API routes, we often need Bearer token. 
        // Let's add a placeholder for token retrieval or assume cookie-based auth is sufficient if backend is on same domain/proxy.
        // GIVEN the RLS requirement, explicit Bearer is safer.

        const token = localStorage.getItem('token'); // Simplistic approach for now

        const response = await fetch(`${API_URL}/clients`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : '',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to create client');
        }

        return response.json();
    },
};
