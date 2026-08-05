'use client';

import { useState, useEffect, useRef } from 'react';
import { useDebounce } from 'use-debounce';
import { ClientService, ClientRecord } from '../../services/client.service';
import { Spinner } from '@/components/ui/loading';

interface ClientOmniboxProps {
    onSelect?: (client: ClientRecord) => void;
    onCreateNew?: (prefill: { phone?: string; name?: string }) => void;
    placeholder?: string;
    className?: string;
}

export function ClientOmnibox({
    onSelect,
    onCreateNew,
    placeholder = 'Search client (Name, Phone, Code)...',
    className = '',
}: ClientOmniboxProps) {
    const [query, setQuery] = useState('');
    const [debouncedQuery] = useDebounce(query, 300);
    const [results, setResults] = useState<ClientRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);

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
                setIsOpen(true);
            } finally {
                setIsLoading(false);
            }
        };

        fetchClients();
    }, [debouncedQuery]);

    const handleSelect = (client: ClientRecord) => {
        if (onSelect) {
            onSelect(client);
        }
        setQuery('');
        setResults([]);
        setIsOpen(false);
    };

    const handleCreate = () => {
        const prefill = /^\d+$/.test(query) || query.startsWith('+')
            ? { phone: query }
            : { name: query };
        if (onCreateNew) {
            onCreateNew(prefill);
            setIsOpen(false);
            return;
        }
        const params = new URLSearchParams();
        if (prefill.phone) params.set('phone', prefill.phone);
        if (prefill.name) params.set('name', prefill.name);
        window.location.href = `/clients/new?${params.toString()}`;
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
                    className="w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-150"
                />
                {isLoading && (
                    <div className="absolute right-3 top-3">
                        <Spinner size="sm" />
                    </div>
                )}
            </div>

            {isOpen && debouncedQuery.length >= 3 && (
                <ul className="absolute z-10 w-full mt-1 bg-card border border-border rounded-xl shadow-lg max-h-60 overflow-auto">
                    {results.map((client, index) => (
                        <li
                            key={client.id}
                            onClick={() => handleSelect(client)}
                            className={`px-4 py-2 cursor-pointer border-b border-border/50 last:border-0 hover:bg-muted/50 flex justify-between items-center transition-colors duration-100 ${
                                index === selectedIndex ? 'bg-primary/10' : ''
                            }`}
                        >
                            <div>
                                <div className="font-medium text-foreground">
                                    {client.first_name} {client.last_name}
                                </div>
                                <div className="text-sm text-muted-foreground">{client.phone}</div>
                            </div>
                            <span className="text-xs font-mono bg-muted text-muted-foreground px-2 py-1 rounded">
                                {client.unique_code}
                            </span>
                        </li>
                    ))}

                    {results.length === 0 && !isLoading && (
                        <li
                            onClick={handleCreate}
                            className="px-4 py-3 text-center cursor-pointer hover:bg-muted/50 text-primary transition-colors duration-150"
                        >
                            <p className="text-muted-foreground mb-1">Aucun client trouvé.</p>
                            <span className="font-medium">Créer le client « {query} »</span>
                        </li>
                    )}
                </ul>
            )}
        </div>
    );
}
