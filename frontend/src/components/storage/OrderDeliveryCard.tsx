import React from 'react';

interface OrderDeliveryCardProps {
    order: any;
    slotLabel: string | null;
    onDeliver: () => void;
    onCancel: () => void;
    loading?: boolean;
}

export const OrderDeliveryCard: React.FC<OrderDeliveryCardProps> = ({
    order,
    slotLabel,
    onDeliver,
    onCancel,
    loading = false
}) => {
    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Delivery Verification</h2>
                    <p className="text-sm text-gray-500">Order ID: {order.id.slice(0, 8)}...</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${order.service_level === 'EXPRESS' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                    {order.service_level}
                </span>
            </div>

            <div className="space-y-6">

                {/* Slot Display */}
                <div className={`p-6 rounded-xl border-2 text-center ${slotLabel ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                    <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Location</p>
                    {slotLabel ? (
                        <p className="text-4xl font-black text-green-700">{slotLabel}</p>
                    ) : (
                        <p className="text-xl font-medium text-gray-500 italic">Not in Storage</p>
                    )}
                </div>

                {/* Client Info */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Client</p>
                        <p className="font-medium text-gray-900">{order.client?.first_name} {order.client?.last_name}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
                        <p className="font-bold text-gray-900">{order.total_price} XOF</p>
                    </div>
                </div>

                {/* Items */}
                <div className="p-3 bg-gray-50 rounded-lg max-h-40 overflow-y-auto">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Items ({order.items?.length || 0})</p>
                    <ul className="space-y-2">
                        {order.items?.map((item: any, idx: number) => (
                            <li key={idx} className="text-sm text-gray-700 flex justify-between border-b border-gray-200 pb-1 last:border-0">
                                <span>{item.quantity}x {item.article_type_id}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Actions */}
                <div className="flex gap-4 pt-2">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onDeliver}
                        disabled={loading}
                        className="flex-1 px-4 py-3 rounded-lg bg-green-600 text-white font-bold text-lg hover:bg-green-700 shadow-md hover:shadow-lg transition-all focus:ring-2 focus:ring-green-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                    >
                        {loading ? (
                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        ) : '✅ '}
                        Confirm Delivery
                    </button>
                </div>
            </div>
        </div>
    );
};
