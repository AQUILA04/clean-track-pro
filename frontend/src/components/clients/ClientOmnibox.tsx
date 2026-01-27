'use client';

import { useState, useEffect, useRef } from 'react';
import { useDebounce } from 'use-debounce';
import { useRouter } from 'next/navigation';
import { ClientService } from '../../services/client.service';

interface Client {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    unique_code: string;
}

interface ClientOmniboxProps {
    onSelect?: (client: Client) => void;
    placeholder?: string;
    className?: string;
}

export function ClientOmnibox({ onSelect, placeholder = 'Search client (Name, Phone, Code)...', className = '' }: ClientOmniboxProps) {
    const [query, setQuery] = useState('');
    const [debouncedQuery] = useDebounce(query, 300);
    const [results, setResults] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    useEffect(() => {
        if (debouncedQuery.length < 3) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        const fetchClients = async () => {
            setIsLoading(true);
            try {
                const data = await ClientService.search(debouncedQuery);
                setResults(data);
                setIsOpen(true);
                setSelectedIndex(-1);
            } catch (error) {
                console.error('Search failed:', error);
                setResults([]);
                setIsOpen(true); // Keep open to show "No results" or error
            } finally {
                setIsLoading(false);
            }
        };

        fetchClients();
    }, [debouncedQuery]);

    const handleSelect = (client: Client) => {
        if (onSelect) {
            onSelect(client);
        }
        setQuery(`${client.first_name} ${client.last_name}`);
        setIsOpen(false);
    };

    const handleCreate = () => {
        // Pass the query to pre-fill the form
        // Assuming the query might be a phone number or name
        const params = new URLSearchParams();
        if (/^\d+$/.test(query)) {
            params.set('phone', query);
        } else {
            params.set('name', query);
        }
        router.push(`/dashboard/clients/new?${params.toString()}`);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev > -1 ? prev - 1 : prev));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex > -1 && results[selectedIndex]) {
                handleSelect(results[selectedIndex]);
            } else if (results.length === 0 && !isLoading) {
                handleCreate();
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
            inputRef.current?.blur();
        }
    };

    return (
        <div className={`relative w-full ${className}`}>
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        if (e.target.value.length === 0) setIsOpen(false);
                    }}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                        if (query.length >= 3) setIsOpen(true);
                    }}
                    placeholder={placeholder}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {isLoading && (
                    <div className="absolute right-3 top-2.5">
                        {/* Simple Spinner */}
                        <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                    </div>
                )}
            </div>

            {isOpen && (debouncedQuery.length >= 3) && (
                <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {results.map((client, index) => (
                        <li
                            key={client.id}
                            onClick={() => handleSelect(client)}
                            className={`px-4 py-2 cursor-pointer border-b border-gray-100 last:border-0 hover:bg-gray-50 flex justify-between items-center ${index === selectedIndex ? 'bg-blue-50' : ''
                                }`}
                        >
                            <div>
                                <div className="font-medium text-gray-900">
                                    {client.first_name} {client.last_name}
                                </div>
                                <div className="text-sm text-gray-500">
                                    {client.phone}
                                </div>
                            </div>
                            <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                {client.unique_code}
                            </span>
                        </li>
                    ))}

                    {results.length === 0 && !isLoading && (
                        <li
                            onClick={handleCreate}
                            className="px-4 py-3 text-center cursor-pointer hover:bg-gray-50 text-blue-600"
                        >
                            <p className="text-gray-500 mb-1">No client found.</p>
                            <span className="font-medium">Create new client "{query}"</span>
                        </li>
                    )}
                </ul>
            )}
        </div>
    );
}
