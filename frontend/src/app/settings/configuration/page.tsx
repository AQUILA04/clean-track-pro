'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TenantService, UpdateTenantConfigDto } from '@/services/tenant.service';

const configSchema = z.object({
    express_multiplier: z.number().min(1.0, 'Multiplier must be at least 1.0'),
    express_sla_hours: z.number().min(1, 'SLA must be at least 1 hour'),
});

type ConfigFormValues = z.infer<typeof configSchema>;

export default function ConfigurationPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const { register, handleSubmit, formState: { errors }, reset } = useForm<ConfigFormValues>({
        resolver: zodResolver(configSchema),
        defaultValues: {
            express_multiplier: 1.5,
            express_sla_hours: 24,
        },
    });

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            setLoading(true);
            const tenant = await TenantService.getCurrentTenant();
            reset({
                express_multiplier: Number(tenant.express_multiplier) || 1.5,
                express_sla_hours: Number(tenant.express_sla_hours) || 24,
            });
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Failed to load configuration' });
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: ConfigFormValues) => {
        try {
            setSaving(true);
            setMessage(null);
            await TenantService.updateConfig(data);
            setMessage({ type: 'success', text: 'Configuration saved successfully' });
            // Reload to ensure we have latest data (optional, but good for sync)
            await loadConfig();
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Failed to save configuration' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-4">Loading configuration...</div>;
    }

    return (
        <div className="max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">Express Mode Configuration</h2>

            {message && (
                <div className={`p-4 mb-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Express Multiplier
                        </label>
                        <p className="text-sm text-gray-500 mb-2">
                            Price multiplier for express orders (e.g., 1.5 = +50% price).
                        </p>
                        <input
                            type="number"
                            step="0.01"
                            {...register('express_multiplier', { valueAsNumber: true })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                        />
                        {errors.express_multiplier && (
                            <p className="mt-1 text-sm text-red-600">{errors.express_multiplier.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Express SLA Target (Hours)
                        </label>
                        <p className="text-sm text-gray-500 mb-2">
                            Target completion time for express orders.
                        </p>
                        <input
                            type="number"
                            {...register('express_sla_hours', { valueAsNumber: true })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                        />
                        {errors.express_sla_hours && (
                            <p className="mt-1 text-sm text-red-600">{errors.express_sla_hours.message}</p>
                        )}
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save Configuration'}
                    </button>
                </div>
            </form>
        </div>
    );
}
