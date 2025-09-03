
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { CustomerAudience, NewAudienceData, AudienceType } from '../types';
import { TrashIcon } from './Icons';

interface AudienceFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: NewAudienceData, id?: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    initialData: CustomerAudience | null;
}

const audienceTypeDescriptions: Record<AudienceType, string> = {
    all: 'Includes every customer in your list.',
    frequent: 'Customers who have booked more than two appointments.',
    lapsed: 'Customers who have not booked in the last 60 days.',
    new: 'Customers who had their first booking within the last 30 days.'
};

const AudienceFormModal: React.FC<AudienceFormModalProps> = ({ isOpen, onClose, onSubmit, onDelete, initialData }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<AudienceType>('all');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

    const isEditMode = !!initialData;
    const audienceTypes: AudienceType[] = ['all', 'frequent', 'lapsed', 'new'];

    useEffect(() => {
        if (isOpen) {
            setIsSubmitting(false);
            setIsConfirmingDelete(false);
            if (initialData) {
                setName(initialData.name);
                setDescription(initialData.description);
                setType(initialData.type);
            } else {
                setName('');
                setDescription('');
                setType('all');
            }
        }
    }, [initialData, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        await onSubmit({ name, description, type }, initialData?.id);
        setIsSubmitting(false);
    };

    const handleDelete = async () => {
        if (!initialData) return;
        setIsSubmitting(true);
        await onDelete(initialData.id);
    };

    const isFormValid = name.trim();
    // Cannot delete or change type of the default "All Customers" audience
    const isDefaultAudience = isEditMode && initialData?.type === 'all';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? 'Edit Audience' : 'New Audience'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="audienceName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Audience Name</label>
                    <input id="audienceName" type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                 <div>
                    <label htmlFor="audienceType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Audience Type</label>
                    <select 
                        id="audienceType" 
                        value={type} 
                        onChange={e => setType(e.target.value as AudienceType)} 
                        disabled={isDefaultAudience}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-200 dark:disabled:bg-gray-600"
                    >
                        {audienceTypes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)} Customers</option>)}
                    </select>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{audienceTypeDescriptions[type]}</p>
                </div>
                <div>
                    <label htmlFor="audienceDesc" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                    <textarea id="audienceDesc" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div className="pt-2 flex justify-between items-center">
                    <div className="min-h-[38px]">
                        {!isDefaultAudience && isEditMode && !isConfirmingDelete && (
                            <button type="button" onClick={() => setIsConfirmingDelete(true)} disabled={isSubmitting} className="inline-flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-500 font-semibold rounded-md hover:bg-red-50 dark:hover:bg-red-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                                <TrashIcon className="h-4 w-4" /> Delete
                            </button>
                        )}
                        {!isDefaultAudience && isEditMode && isConfirmingDelete && (
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
                            {isSubmitting ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Audience')}
                        </button>
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default AudienceFormModal;