import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X, Plus } from 'lucide-react';

interface Client {
    _id: string;
    companyName: string;
}

interface SearchableClientSelectProps {
    clients: Client[];
    value: string;
    onChange: (clientId: string) => void;
    onAddClient?: () => void;
    placeholder?: string;
}

export const SearchableClientSelect = ({
    clients,
    value,
    onChange,
    onAddClient,
    placeholder = "Select Client (Optional)"
}: SearchableClientSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedClient = clients.find(c => c._id === value);

    const filteredClients = clients.filter(client =>
        client.companyName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (clientId: string) => {
        onChange(clientId);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
        setSearchTerm('');
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Selected Value Display */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-2 border rounded-lg bg-white cursor-pointer flex items-center justify-between hover:border-blue-400 transition"
            >
                <span className={selectedClient ? 'text-gray-900' : 'text-gray-400'}>
                    {selectedClient ? selectedClient.companyName : placeholder}
                </span>
                <div className="flex items-center gap-2">
                    {selectedClient && (
                        <button
                            onClick={handleClear}
                            className="p-1 hover:bg-gray-100 rounded-full transition"
                            type="button"
                        >
                            <X className="w-4 h-4 text-gray-500" />
                        </button>
                    )}
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-64 overflow-hidden">
                    {/* Search Input */}
                    <div className="p-2 border-b sticky top-0 bg-white">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search clients..."
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    {/* Options List */}
                    <div className="overflow-y-auto max-h-48">
                        {filteredClients.length === 0 ? (
                            <div className="p-3">
                                <div className="text-sm text-gray-500 text-center mb-3">
                                    No clients found
                                </div>
                                {onAddClient && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onAddClient();
                                            setIsOpen(false);
                                            setSearchTerm('');
                                        }}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add New Client
                                    </button>
                                )}
                            </div>
                        ) : (
                            filteredClients.map((client) => (
                                <div
                                    key={client._id}
                                    onClick={() => handleSelect(client._id)}
                                    className={`px-4 py-2 cursor-pointer hover:bg-blue-50 transition ${value === client._id ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-700'
                                        }`}
                                >
                                    {client.companyName}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
