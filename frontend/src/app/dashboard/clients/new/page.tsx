import { ClientRegistrationForm } from '@/components/clients/ClientRegistrationForm';

export default function NewClientPage() {
    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Add New Client</h1>
                <p className="mt-2 text-gray-600">Register a new client to the system and generate their unique identification code.</p>
            </div>

            <div className="flex justify-center">
                <ClientRegistrationForm />
            </div>
        </div>
    );
}
