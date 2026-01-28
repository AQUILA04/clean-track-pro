import React from 'react';
import { format } from 'date-fns';
import { AlertTriangle, Clock, CheckCircle, Package } from 'lucide-react';
import { getSLAStatus } from '../../utils/sla.utils';

interface OrderSummary {
    id: string;
    client_name: string;
    items_summary: string;
    due_date: string;
    status: string;
    total_price: number;
    service_level: string;
    created_at: string;
}

interface PaginationProps {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

interface OrderTableProps {
    orders: OrderSummary[];
    loading: boolean;
    pagination: PaginationProps;
}

export const OrderTable: React.FC<OrderTableProps> = ({ orders, loading, pagination }) => {
    if (loading) {
        return <div className="p-4 text-center">Loading orders...</div>;
    }

    if (orders.length === 0) {
        return <div className="p-4 text-center text-gray-500">No active orders found.</div>;
    }

    return (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => {
                        const sla = getSLAStatus(order.due_date);

                        // Row styling based on SLA
                        // Row styling based on SLA
                        let rowClass = 'hover:bg-gray-50';
                        if (sla === 'danger') rowClass = 'bg-red-50 hover:bg-red-100';
                        if (sla === 'warning') rowClass = 'bg-yellow-50 hover:bg-yellow-100';

                        // Due Date styling
                        // Due Date styling
                        let dateClass = 'text-sm font-medium text-gray-900';
                        if (sla === 'danger') dateClass = 'text-sm font-medium text-red-700';
                        if (sla === 'warning') dateClass = 'text-sm font-medium text-yellow-700';

                        return (
                            <tr key={order.id} className={rowClass}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    #{order.id.slice(0, 8)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {order.client_name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {order.items_summary}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        {sla === 'danger' && <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />}
                                        {sla === 'warning' && <Clock className="w-4 h-4 text-yellow-600 mr-2" />}
                                        <span className={dateClass}>
                                            {format(new Date(order.due_date), 'MMM d, HH:mm')}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                        {order.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                    {order.total_price.toFixed(2)} €
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* Pagination Controls */}
            <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200 bg-gray-50">
                <div className="flex-1 flex justify-between sm:hidden">
                    <button
                        onClick={() => pagination.onPageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => pagination.onPageChange(pagination.page + 1)}
                        disabled={pagination.page >= pagination.totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-gray-700">
                            Showing page <span className="font-medium">{pagination.page}</span> of <span className="font-medium">{pagination.totalPages}</span>
                        </p>
                    </div>
                    <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <button
                                onClick={() => pagination.onPageChange(pagination.page - 1)}
                                disabled={pagination.page === 1}
                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => pagination.onPageChange(pagination.page + 1)}
                                disabled={pagination.page >= pagination.totalPages}
                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </nav>
                    </div>
                </div>
            </div>
        </div>
    );
};
