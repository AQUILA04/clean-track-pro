function normalizeApiMessage(message: unknown): string | null {
    if (Array.isArray(message) && message.length > 0) {
        return String(message[0]);
    }
    if (typeof message === 'string' && message.trim()) {
        return message;
    }
    return null;
}

export async function parseFetchError(response: Response, fallback = 'Une erreur est survenue'): Promise<string> {
    try {
        const body = await response.json();
        const fromMessage = normalizeApiMessage(body?.message);
        if (fromMessage) return fromMessage;
        if (typeof body?.error === 'string' && body.error.trim()) {
            return body.error;
        }
    } catch {
        // ignore JSON parse errors
    }

    return fallback;
}

export function getErrorMessage(error: unknown, fallback = 'Une erreur est survenue'): string {
    // Axios / NestJS: prefer response body message over generic HTTP status text
    if (error && typeof error === 'object' && 'response' in error) {
        const data = (error as { response?: { data?: { message?: unknown; error?: string } } }).response?.data;
        const fromMessage = normalizeApiMessage(data?.message);
        if (fromMessage) return fromMessage;
        if (typeof data?.error === 'string' && data.error.trim()) {
            return data.error;
        }
    }

    if (error instanceof Error && error.message.trim()) {
        return error.message;
    }
    if (typeof error === 'string' && error.trim()) {
        return error;
    }
    return fallback;
}
