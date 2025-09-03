import React, { useState } from 'react';
import Modal from './Modal';
import { NewProductData } from '../types';
import { useToast } from '../contexts/ToastContext';

interface ImportProductsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (data: NewProductData[]) => Promise<void>;
}

const ImportProductsModal: React.FC<ImportProductsModalProps> = ({ isOpen, onClose, onImport }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const { addToast } = useToast();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedFile(event.target.files[0]);
        }
    };

    const handleDownloadTemplate = () => {
        const headers = "name,description,price,stock_quantity";
        const exampleRow1 = "Premium Pomade,High-shine, strong hold pomade,20.50,100";
        const exampleRow2 = "Matte Clay,Natural look, matte finish clay,19.00,75";
        const csvContent = `${headers}\n${exampleRow1}\n${exampleRow2}`;
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'products_template.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };
    
    const handleProcessImport = () => {
        if (!selectedFile) {
            addToast('Please select a file to import.', 'error');
            return;
        }

        setIsProcessing(true);
        const reader = new FileReader();

        reader.onload = async (e) => {
            const text = e.target?.result;
            if (typeof text !== 'string') {
                addToast('Could not read the file.', 'error');
                setIsProcessing(false);
                return;
            }

            const rows = text.split('\n').filter(row => row.trim() !== '');
            const header = rows.shift()?.trim().split(',');

            if (!header || header.join(',') !== 'name,description,price,stock_quantity') {
                addToast('Invalid CSV headers. Please use the provided template.', 'error');
                setIsProcessing(false);
                return;
            }

            const newProducts: NewProductData[] = [];
            rows.forEach((row, index) => {
                const values = row.split(',');
                if (values.length !== 4) {
                    addToast(`Skipping invalid row ${index + 2}.`, 'info');
                    return;
                }
                
                const [name, description, priceStr, stockStr] = values;
                const price = parseFloat(priceStr);
                const stock_quantity = parseInt(stockStr, 10);

                if (isNaN(price) || isNaN(stock_quantity)) {
                    addToast(`Skipping invalid data in row ${index + 2}.`, 'info');
                    return;
                }
                
                newProducts.push({ name, description, price, stock_quantity });
            });

            if (newProducts.length > 0) {
                await onImport(newProducts);
            } else {
                 addToast('No valid products found in the file to import.', 'info');
            }
            
            setIsProcessing(false);
            setSelectedFile(null);
            onClose();
        };
        
        reader.onerror = () => {
            addToast('Error reading file.', 'error');
            setIsProcessing(false);
        };
        
        reader.readAsText(selectedFile);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Import Products from CSV">
            <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Format your product data in a CSV file using our template, then upload it here to add multiple products at once.
                </p>
                
                <button 
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="w-full text-indigo-600 dark:text-indigo-400 font-semibold py-2 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/50"
                >
                    Download CSV Template
                </button>
                
                <div>
                    <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload File</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <div className="flex text-sm text-gray-600 dark:text-gray-400">
                                <label htmlFor="file-input" className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                                    <span>{selectedFile ? 'Change file' : 'Upload a file'}</span>
                                    <input id="file-input" name="file-upload" type="file" className="sr-only" accept=".csv" onChange={handleFileChange} />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                            </div>
                             {selectedFile ? (
                                <p className="text-xs text-gray-500 dark:text-gray-400">Selected: {selectedFile.name}</p>
                             ) : (
                                <p className="text-xs text-gray-500 dark:text-gray-400">CSV up to 10MB</p>
                             )}
                        </div>
                    </div>
                </div>

                <div className="pt-4 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} disabled={isProcessing} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-md shadow-sm hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500">
                        Cancel
                    </button>
                    <button 
                        type="button" 
                        onClick={handleProcessImport}
                        disabled={!selectedFile || isProcessing} 
                        className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed dark:disabled:bg-indigo-800"
                    >
                        {isProcessing ? 'Processing...' : 'Upload & Import'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ImportProductsModal;