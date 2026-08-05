'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Table } from '@/components/ui/table';
import { Modal } from '@/components/ui/modal';
import { ArticleType } from '@/types/article-type';
import { articleTypeService } from '@/services/article-type.service';
import { ContentLoader } from '@/components/ui/loading';

const articleTypeSchema = z.object({
    label: z.string().min(1, 'Label is required').max(100, 'Label is too long'),
    category: z.string().min(1, 'Category is required').max(50, 'Category is too long'),
    is_active: z.boolean().optional(),
});

type ArticleTypeFormValues = z.infer<typeof articleTypeSchema>;

export function ArticleTypesTab() {
    const [articleTypes, setArticleTypes] = useState<ArticleType[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ArticleType | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<ArticleTypeFormValues>({
        resolver: zodResolver(articleTypeSchema),
        defaultValues: {
            is_active: true,
        },
    });

    const fetchArticleTypes = async () => {
        try {
            setLoading(true);
            const data = await articleTypeService.findAll();
            setArticleTypes(data);
        } catch (error) {
            console.error('Failed to fetch article types:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchArticleTypes();
    }, []);

    const openCreateModal = () => {
        setEditingItem(null);
        reset({ label: '', category: '', is_active: true });
        setIsModalOpen(true);
    };

    const openEditModal = (item: ArticleType) => {
        setEditingItem(item);
        setValue('label', item.label);
        setValue('category', item.category);
        setValue('is_active', item.is_active);
        setIsModalOpen(true);
    };

    const onSubmit = async (data: ArticleTypeFormValues) => {
        try {
            if (editingItem) {
                await articleTypeService.update(editingItem.id, data);
            } else {
                await articleTypeService.create(data);
            }
            setIsModalOpen(false);
            fetchArticleTypes();
        } catch (error) {
            console.error('Failed to save article type:', error);
        }
    };

    const columns = [
        { header: 'Label', accessor: 'label' as keyof ArticleType },
        { header: 'Category', accessor: 'category' as keyof ArticleType },
        {
            header: 'Status',
            accessor: (item: ArticleType) => (
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
            accessor: (item: ArticleType) => (
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
                    <h2 className="text-base font-semibold leading-6 text-gray-900">Article Types</h2>
                    <p className="mt-2 text-sm text-gray-700">
                        A list of all article types available for orders including their label, category, and status.
                    </p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                        Add Article Type
                    </button>
                </div>
            </div>
            <div className="mt-8 flow-root">
                {loading ? (
                    <ContentLoader label="Chargement des types d'articles…" />
                ) : (
                    <Table
                        data={articleTypes}
                        columns={columns}
                        keyExtractor={(item) => item.id}
                        onRowClick={openEditModal}
                        emptyMessage="No article types found. Create one to get started."
                    />
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingItem ? 'Edit Article Type' : 'Add Article Type'}
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
                        <label htmlFor="category" className="block text-sm font-medium leading-6 text-gray-900">
                            Category
                        </label>
                        <div className="mt-2">
                            <input
                                type="text"
                                id="category"
                                {...register('category')}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 pl-2"
                            />
                            {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
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
                            <p className="text-gray-500">Active article types can be selected in orders.</p>
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
