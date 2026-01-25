'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { clientSchema, ClientFormValues } from '@/lib/validations/client';
import { ClientService } from '@/services/client.service';
// Assuming basic UI components or using standard HTML if UI lib missing
// Requirements say "Use standard TailWind components defined in previous stories"
// I will use standard HTML with Tailwind classes for now to avoid missing component errors,
// unless I see 'ui' folder in components.

export function ClientRegistrationForm() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<ClientFormValues>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            first_name: '',
            last_name: '',
            phone: '',
            email: '',
            notes: '',
        },
    });

    const onSubmit = async (data: ClientFormValues) => {
        setLoading(true);
        setError(null);
        try {
            await ClientService.create(data);
            setSuccess(true);
            reset();
            // Optional: Redirect or show success details
            // router.push('/dashboard/clients'); 
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="p-6 bg-green-50 text-green-700 border border-green-200 rounded-lg">
                <h3 className="text-lg font-medium">Client Created Successfully!</h3>
                <p className="mt-2">The client has been registered with a unique code.</p>
                <button
                    onClick={() => setSuccess(false)}
                    className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                >
                    Create Another Client
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-lg bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="space-y-2">
                <h2 className="text-xl font-semibold text-gray-900">Register New Client</h2>
                <p className="text-sm text-gray-500">Enter client details to generate a unique code.</p>
            </div>

            {error && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">First Name *</label>
                    <input
                        {...register('first_name')}
                        id="first_name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="John"
                    />
                    {errors.first_name && <p className="text-red-500 text-xs">{errors.first_name.message}</p>}
                </div>

                <div className="space-y-1">
                    <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">Last Name *</label>
                    <input
                        {...register('last_name')}
                        id="last_name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Doe"
                    />
                    {errors.last_name && <p className="text-red-500 text-xs">{errors.last_name.message}</p>}
                </div>
            </div>

            <div className="space-y-1">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number * (E.164)</label>
                <input
                    {...register('phone')}
                    id="phone"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+33612345678"
                />
                {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
            </div>

            <div className="space-y-1">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email (Optional)</label>
                <input
                    {...register('email')}
                    id="email"
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="john@example.com"
                />
                {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
            </div>

            <div className="space-y-1">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                <textarea
                    {...register('notes')}
                    id="notes"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Additional details..."
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {loading ? 'Creating...' : 'Create Client'}
            </button>
        </form>
    );
}
