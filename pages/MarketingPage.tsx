import React, { useState, useMemo, useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useData } from '../contexts/DataContext';
import { PlusIcon, SearchIcon, ArrowDownTrayIcon, ChevronDownIcon } from '../components/Icons';
import Pagination from '../components/Pagination';
import CampaignFormModal from '../components/CampaignFormModal';
import AudienceFormModal from '../components/AudienceFormModal';
import { MarketingCampaign, CustomerAudience, NewCampaignData, NewAudienceData } from '../types';

const ITEMS_PER_PAGE = 10;
type ActiveTab = 'campaigns' | 'audiences';

const statusColors: Record<MarketingCampaign['status'], string> = {
    Draft: 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200',
    Active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    Completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    Archived: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
};

const downloadFile = (blob: Blob, filename: string) => {
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

const CampaignsTab: React.FC = () => {
    const { campaigns, audiences, loading, createCampaign, updateCampaign, deleteCampaign } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState<MarketingCampaign | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isExportOpen, setIsExportOpen] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setIsExportOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredCampaigns = useMemo(() => {
        return campaigns.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [campaigns, searchTerm]);

    const paginatedCampaigns = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredCampaigns.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredCampaigns, currentPage]);

    const handleOpenModal = (campaign: MarketingCampaign | null = null) => {
        setSelectedCampaign(campaign);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setSelectedCampaign(null);
        setIsModalOpen(false);
    };

    const handleSave = async (data: NewCampaignData, id?: string) => {
        if (id) {
            await updateCampaign(id, data);
        } else {
            await createCampaign(data);
        }
        handleCloseModal();
    };

    const handleDelete = async (id: string) => {
        await deleteCampaign(id);
        handleCloseModal();
    };

    const handleExport = (format: 'csv' | 'pdf') => {
        if (campaigns.length === 0) return;
        setIsExportOpen(false);

        const filename = 'marketing_campaigns';
        const headers = [
            { key: 'name', label: 'Campaign Name' },
            { key: 'status', label: 'Status' },
            { key: 'channel', label: 'Channel' },
            { key: 'audience', label: 'Audience' },
            { key: 'customers_reached', label: 'Reached' },
            { key: 'bookings_generated', label: 'Bookings' }
        ];

        if (format === 'csv') {
            const headerRow = headers.map(h => `"${h.label}"`).join(',');
            const bodyRows = campaigns.map(c => {
                return [
                    `"${c.name.replace(/"/g, '""')}"`,
                    `"${c.status}"`,
                    `"${c.channel}"`,
                    `"${c.audience.name.replace(/"/g, '""')}"`,
                    c.customers_reached,
                    c.bookings_generated
                ].join(',');
            });
            const csvString = [headerRow, ...bodyRows].join('\n');
            const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
            downloadFile(blob, `${filename}.csv`);
        } else if (format === 'pdf') {
            const doc = new jsPDF();
            const tableData = campaigns.map(c => [
                c.name, c.status, c.channel, c.audience.name, c.customers_reached, c.bookings_generated
            ]);
            
            (doc as any).autoTable({
                head: [headers.map(h => h.label)],
                body: tableData,
                didDrawPage: (data) => {
                    doc.setFontSize(20);
                    doc.text("Marketing Campaigns", data.settings.margin.left, 15);
                }
            });
            doc.save(`${filename}.pdf`);
        }
    };

    return (
        <>
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
            <div className="relative w-full sm:max-w-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Search campaigns..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
            </div>
            <div className="flex-grow flex justify-end items-center gap-4">
                <div className="relative" ref={exportMenuRef}>
                    <button
                        onClick={() => setIsExportOpen(!isExportOpen)}
                        disabled={loading || campaigns.length === 0}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                        <ArrowDownTrayIcon className="h-5 w-5" />
                        Export
                        <ChevronDownIcon className="h-5 w-5" />
                    </button>
                    {isExportOpen && (
                        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                            <div className="py-1">
                                <button onClick={() => handleExport('csv')} className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Export as CSV</button>
                                <button onClick={() => handleExport('pdf')} className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Export as PDF</button>
                            </div>
                        </div>
                    )}
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <PlusIcon className="h-5 w-5" />
                    <span>New Campaign</span>
                </button>
            </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">Campaign Name</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                            <th scope="col" className="px-6 py-3">Channel</th>
                            <th scope="col" className="px-6 py-3">Audience</th>
                            <th scope="col" className="px-6 py-3 text-center">Reached</th>
                            <th scope="col" className="px-6 py-3 text-center">Bookings</th>
                            <th scope="col" className="px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} className="text-center py-10">Loading campaigns...</td></tr>
                        ) : paginatedCampaigns.length === 0 ? (
                            <tr><td colSpan={7} className="text-center py-10">No campaigns found.</td></tr>
                        ) : (
                            paginatedCampaigns.map(c => (
                                <tr key={c.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{c.name}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[c.status]}`}>{c.status}</span>
                                    </td>
                                    <td className="px-6 py-4">{c.channel}</td>
                                    <td className="px-6 py-4">{c.audience.name}</td>
                                    <td className="px-6 py-4 text-center">{c.customers_reached}</td>
                                    <td className="px-6 py-4 text-center">{c.bookings_generated}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleOpenModal(c)} className="font-medium text-indigo-600 dark:text-indigo-500 hover:underline">Edit</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {filteredCampaigns.length > ITEMS_PER_PAGE && <Pagination currentPage={currentPage} totalPages={Math.ceil(filteredCampaigns.length / ITEMS_PER_PAGE)} onPageChange={setCurrentPage} />}
        </div>
        <CampaignFormModal 
            isOpen={isModalOpen} 
            onClose={handleCloseModal}
            onSubmit={handleSave}
            onDelete={handleDelete}
            initialData={selectedCampaign}
            audiences={audiences}
        />
        </>
    );
};

const AudiencesTab: React.FC = () => {
    const { audiences, loading, createAudience, updateAudience, deleteAudience } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAudience, setSelectedAudience] = useState<CustomerAudience | null>(null);

    const handleOpenModal = (audience: CustomerAudience | null = null) => {
        setSelectedAudience(audience);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setSelectedAudience(null);
        setIsModalOpen(false);
    };

    const handleSave = async (data: NewAudienceData, id?: string) => {
        if (id) {
            await updateAudience(id, data);
        } else {
            await createAudience(data);
        }
        handleCloseModal();
    };

    const handleDelete = async (id: string) => {
        await deleteAudience(id);
        handleCloseModal();
    };

    return (
        <>
            <div className="flex justify-end mb-4">
                <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <PlusIcon className="h-5 w-5" />
                    <span>New Audience</span>
                </button>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">Audience Name</th>
                                <th scope="col" className="px-6 py-3">Description</th>
                                <th scope="col" className="px-6 py-3 text-center">Customer Count</th>
                                <th scope="col" className="px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={4} className="text-center py-10">Loading audiences...</td></tr>
                            ) : audiences.length === 0 ? (
                                <tr><td colSpan={4} className="text-center py-10">No audiences found.</td></tr>
                            ) : (
                                audiences.map(a => (
                                    <tr key={a.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{a.name}</td>
                                        <td className="px-6 py-4">{a.description}</td>
                                        <td className="px-6 py-4 text-center">{a.customer_count}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => handleOpenModal(a)} className="font-medium text-indigo-600 dark:text-indigo-500 hover:underline">Edit</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <AudienceFormModal 
                isOpen={isModalOpen} 
                onClose={handleCloseModal}
                onSubmit={handleSave}
                onDelete={handleDelete}
                initialData={selectedAudience}
            />
        </>
    );
};


const MarketingPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('campaigns');

    return (
        <div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Marketing</h2>
            <p className="mt-1 text-gray-600 dark:text-gray-400">Engage your customers with targeted campaigns.</p>

            <div className="mt-6 mb-4 border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('campaigns')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'campaigns' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'}`}
                    >
                        Campaigns
                    </button>
                    <button
                        onClick={() => setActiveTab('audiences')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'audiences' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'}`}
                    >
                        Audiences
                    </button>
                </nav>
            </div>

            <div>
                {activeTab === 'campaigns' && <CampaignsTab />}
                {activeTab === 'audiences' && <AudiencesTab />}
            </div>
        </div>
    );
};

export default MarketingPage;