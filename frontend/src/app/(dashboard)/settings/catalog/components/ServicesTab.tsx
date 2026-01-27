'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Table } from '@/components/ui/table';
import { Modal } from '@/components/ui/modal';
import { ServiceDefinition } from '@/types/service-definition';
import { serviceDefinitionService } from '@/services/service-definition.service';

const serviceSchema = z.object({
    label: z.string().min(1, 'Label is required').max(100, 'Label is too long'),
    description: z.string().optional(),
    is_active: z.boolean().optional(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

export function ServicesTab() {
    const [services, setServices] = useState<ServiceDefinition[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ServiceDefinition | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<ServiceFormValues>({
        resolver: zodResolver(serviceSchema),
        defaultValues: {
            is_active: true,
        },
    });

    const fetchServices = async () => {
        try {
            setLoading(true);
            const data = await serviceDefinitionService.findAll();
            setServices(data);
        } catch (error) {
            console.error('Failed to fetch services:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    const openCreateModal = () => {
        setEditingItem(null);
        reset({ label: '', description: '', is_active: true });
        setIsModalOpen(true);
    };

    const openEditModal = (item: ServiceDefinition) => {
        setEditingItem(item);
        setValue('label', item.label);
        setValue('description', item.description || '');
        setValue('is_active', item.is_active);
        setIsModalOpen(true);
    };

    const onSubmit = async (data: ServiceFormValues) => {
        try {
            if (editingItem) {
                await serviceDefinitionService.update(editingItem.id, data);
            } else {
                await serviceDefinitionService.create(data);
            }
            setIsModalOpen(false);
            fetchServices();
        } catch (error) {
            console.error('Failed to save service:', error);
        }
    };

    const columns = [
        { header: 'Label', accessor: 'label' as keyof ServiceDefinition },
        { header: 'Description', accessor: 'description' as keyof ServiceDefinition },
        {
            header: 'Status',
            accessor: (item: ServiceDefinition) => (
                <span
                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${item.is_active
                        ? 'bg-green-50 text-green-700 ring-green-600/20'
                        : 'bg-red-50 text-red-700 ring-red-600/20'
                        }`}
                >
                    {item.is_active ? 'Active' : 'Inactive'}
                </span>
            ),
        },
        {
            header: 'Actions',
            accessor: (item: ServiceDefinition) => (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(item);
                    }}
                    className="text-indigo-600 hover:text-indigo-900 font-medium"
                >
                    Edit
                </button>
            ),
        },
    ];

    return (
        <div>
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h2 className="text-base font-semibold leading-6 text-gray-900">Services</h2>
                    <p className="mt-2 text-sm text-gray-700">
                        Manage the specific services (e.g., Washing, Ironing) offered.
                    </p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                        Add Service
                    </button>
                </div>
            </div>
            <div className="mt-8 flow-root">
                {loading ? (
                    <div className="text-center py-10">Loading...</div>
                ) : (
                    <Table
                        data={services}
                        columns={columns}
                        keyExtractor={(item) => item.id}
                        onRowClick={openEditModal}
                        emptyMessage="No services found. Create one to get started."
                    />
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingItem ? 'Edit Service' : 'Add Service'}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
                    <div>
                        <label htmlFor="label" className="block text-sm font-medium leading-6 text-gray-900">
                            Label
                        </label>
                        <div className="mt-2">
                            <input
                                type="text"
                                id="label"
                                {...register('label')}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 pl-2"
                            />
                            {errors.label && <p className="mt-1 text-sm text-red-600">{errors.label.message}</p>}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium leading-6 text-gray-900">
                            Description
                        </label>
                        <div className="mt-2">
                            <textarea
                                id="description"
                                {...register('description')}
                                rows={3}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 pl-2"
                            />
                            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
                        </div>
                    </div>

                    <div className="relative flex gap-x-3">
                        <div className="flex h-6 items-center">
                            <input
                                id="is_active"
                                type="checkbox"
                                {...register('is_active')}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                            />
                        </div>
                        <div className="text-sm leading-6">
                            <label htmlFor="is_active" className="font-medium text-gray-900">
                                Active
                            </label>
                            <p className="text-gray-500">Active services can be selected in orders.</p>
                        </div>
                    </div>

                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
                        >
                            {isSubmitting ? 'Saving...' : 'Save'}
                        </button>
                        <button
                            type="button"
                            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                            onClick={() => setIsModalOpen(false)}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
