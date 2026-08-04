'use client';

import { logout } from '@/lib/logout';

export default function LogoutButton() {
    return (
        <button
            onClick={() => logout()}
            className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors"
        >
            Logout
        </button>
    );
}
