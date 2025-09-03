
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { MarketingCampaign, NewCampaignData, CustomerAudience } from '../types';
import { TrashIcon } from './Icons';

interface CampaignFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: NewCampaignData, id?: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    initialData: MarketingCampaign | null;
    audiences: CustomerAudience[];
}

const CampaignFormModal: React.FC<CampaignFormModalProps> = ({ isOpen, onClose, onSubmit, onDelete, initialData, audiences }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [channel, setChannel] = useState<MarketingCampaign['channel']>('Email');
    const [status, setStatus] = useState<MarketingCampaign['status']>('Draft');
    const [audienceId, setAudienceId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

    const isEditMode = !!initialData;
    const channels: MarketingCampaign['channel'][] = ['Email', 'SMS', 'Social'];
    const statuses: MarketingCampaign['status'][] = ['Draft', 'Active', 'Completed', 'Archived'];

    useEffect(() => {
        if (isOpen) {
            setIsSubmitting(false);
            setIsConfirmingDelete(false);
            if (initialData) {
                setName(initialData.name);
                setDescription(initialData.description);
                setChannel(initialData.channel);
                setStatus(initialData.status);
                setAudienceId(initialData.audience.id);
            } else {
                setName('');
                setDescription('');
                setChannel('Email');
                setStatus('Draft');
                setAudienceId(audiences.length > 0 ? audiences[0].id : '');
            }
        }
    }, [initialData, isOpen, audiences]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        await onSubmit({ name, description, channel, status, audienceId }, initialData?.id);
        setIsSubmitting(false);
    };
    
    const handleDelete = async () => {
        if (!initialData) return;
        setIsSubmitting(true);
        await onDelete(initialData.id);
    };

    const isFormValid = name.trim() && audienceId;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? 'Edit Campaign' : 'New Campaign'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="campaignName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Campaign Name</label>
                    <input id="campaignName" type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                    <label htmlFor="campaignDesc" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                    <textarea id="campaignDesc" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="campaignChannel" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Channel</label>
                        <select id="campaignChannel" value={channel} onChange={e => setChannel(e.target.value as any)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                            {channels.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="campaignStatus" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                        <select id="campaignStatus" value={status} onChange={e => setStatus(e.target.value as any)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor="campaignAudience" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Audience</label>
                    <select id="campaignAudience" value={audienceId} onChange={e => setAudienceId(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        <option value="" disabled>Select an audience</option>
                        {audiences.map(a => <option key={a.id} value={a.id}>{a.name} ({a.customer_count} customers)</option>)}
                    </select>
                </div>
                <div className="pt-2 flex justify-between items-center">
                    <div className="min-h-[38px]">
                        {isEditMode && !isConfirmingDelete && (
                            <button type="button" onClick={() => setIsConfirmingDelete(true)} disabled={isSubmitting} className="inline-flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-500 font-semibold rounded-md hover:bg-red-50 dark:hover:bg-red-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                                <TrashIcon className="h-4 w-4" /> Delete
                            </button>
                        )}
                        {isEditMode && isConfirmingDelete && (
                            <div className="flex items-center gap-3">
                                <button type="button" onClick={handleDelete} disabled={isSubmitting} className="inline-flex items-center px-4 py-2 bg-red-600 text-white font-semibold rounded-md shadow-sm hover:bg-red-700">
                                    Confirm Deletion
                                </button>
                                <button type="button" onClick={() => setIsConfirmingDelete(false)} className="text-sm text-gray-600 dark:text-gray-400 hover:underline">
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-md shadow-sm hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500">
                            Close
                        </button>
                        <button type="submit" disabled={!isFormValid || isSubmitting} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed dark:disabled:bg-indigo-800">
                            {isSubmitting ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Campaign')}
                        </button>
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default CampaignFormModal;
