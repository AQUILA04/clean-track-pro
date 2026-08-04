import React from 'react';

interface Column<T> {
    header: string;
    accessor: keyof T | ((item: T) => React.ReactNode);
    className?: string;
}

interface TableProps<T> {
    data: T[];
    columns: Column<T>[];
    keyExtractor: (item: T) => string;
    onRowClick?: (item: T) => void;
    emptyMessage?: string;
}

export const Table = <T,>({ data, columns, keyExtractor, onRowClick, emptyMessage = "No data found" }: TableProps<T>) => {
    return (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/30">
                    <tr>
                        {columns.map((col, idx) => (
                            <th
                                key={idx}
                                scope="col"
                                className={`py-3.5 pl-4 pr-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:pl-6 ${col.className || ''}`}
                            >
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className="py-6 text-center text-sm text-muted-foreground">
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        data.map((item) => (
                            <tr
                                key={keyExtractor(item)}
                                onClick={() => onRowClick && onRowClick(item)}
                                className={`${onRowClick ? "cursor-pointer" : ""} hover:bg-muted/30 transition-colors`}
                            >
                                {columns.map((col, idx) => (
                                    <td
                                        key={idx}
                                        className={`whitespace-nowrap py-4 pl-4 pr-3 text-sm text-foreground sm:pl-6 ${col.className || ''}`}
                                    >
                                        {typeof col.accessor === 'function'
                                            ? col.accessor(item)
                                            : (item[col.accessor] as React.ReactNode)}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};
