import Link from "next/link";

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Settings</h1>

            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <Link
                        href="/settings/agency"
                        className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
                    >
                        Agency
                    </Link>
                    <Link
                        href="/settings/configuration"
                        className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
                    >
                        Configuration
                    </Link>
                </nav>
            </div>

            <div className="mt-4">
                {children}
            </div>
        </div>
    );
}
