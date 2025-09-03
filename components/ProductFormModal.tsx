

import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Product, NewProductData, NewProductVariantData } from '../types';
import { TrashIcon, ArchiveBoxIcon, PlusIcon } from './Icons';
import { useToast } from '../contexts/ToastContext';

interface ProductFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: NewProductData, id?: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    initialData: Product | null;
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
};

const ProductFormModal: React.FC<ProductFormModalProps> = ({ isOpen, onClose, onSubmit, onDelete, initialData }) => {
    const [productType, setProductType] = useState<'simple' | 'variable'>('simple');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState(0);
    const [stock, setStock] = useState(0);
    const [variants, setVariants] = useState<NewProductVariantData[]>([]);
    const [imageBase64, setImageBase64] = useState<string | null | undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const { addToast } = useToast();

    const isEditMode = !!initialData;

    useEffect(() => {
        if (isOpen) {
            setIsSubmitting(false);
            setIsConfirmingDelete(false);
            setImageBase64(undefined); // Reset image change state on open
            if (initialData) {
                setName(initialData.name);
                setDescription(initialData.description);
                if (initialData.variants && initialData.variants.length > 0) {
                    setProductType('variable');
                    setVariants(initialData.variants.map(({ id, ...rest }) => rest));
                    setPrice(0);
                    setStock(0);
                } else {
                    setProductType('simple');
                    setVariants([]);
                    setPrice(initialData.price);
                    setStock(initialData.stock_quantity);
                }
            } else {
                setProductType('simple');
                setName('');
                setDescription('');
                setPrice(0);
                setStock(0);
                setVariants([]);
            }
        }
    }, [initialData, isOpen]);

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const base64 = await fileToBase64(file);
            setImageBase64(base64);
        }
    };

    const handleRemoveImage = () => {
        setImageBase64(null);
        const fileInput = document.getElementById('productImage') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };
    
    const handleAddVariant = () => {
        setVariants([...variants, { name: '', price: 0, stock_quantity: 0 }]);
    };
    
    const handleVariantChange = (index: number, field: keyof NewProductVariantData, value: string | number) => {
        const newVariants = [...variants];
        newVariants[index] = { ...newVariants[index], [field]: value };
        setVariants(newVariants);
    };

    const handleRemoveVariant = (index: number) => {
        setVariants(variants.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) {
            addToast('Please fill all required fields.', 'error');
            return;
        }
        setIsSubmitting(true);

        const payload: NewProductData = {
            name,
            description,
            price: Number(price),
            stock_quantity: Number(stock),
            variants: productType === 'variable' ? variants : [],
        };
        if (imageBase64 !== undefined) {
            payload.imageBase64 = imageBase64;
        }

        await onSubmit(payload, initialData?.id);
        setIsSubmitting(false);
    };
    
    const handleDelete = async () => {
        if (!initialData) return;
        setIsSubmitting(true);
        await onDelete(initialData.id);
    };

    const currentImageUrl = imageBase64 === undefined ? initialData?.imageUrl : imageBase64;
    const isFormValid = name.trim() && (productType === 'simple' ? price >= 0 && stock >= 0 : variants.every(v => v.name.trim() && v.price >= 0 && v.stock_quantity >= 0));

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? 'Edit Product' : 'New Product'}>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
                <div>
                    <label htmlFor="productName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Product Name</label>
                    <input id="productName" type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Product Image</label>
                    <div className="mt-1 flex items-center gap-4">
                        {currentImageUrl ? (
                            <img src={currentImageUrl} alt="Product preview" className="h-20 w-20 rounded-md object-cover" />
                        ) : (
                            <div className="h-20 w-20 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                                <ArchiveBoxIcon className="h-8 w-8" />
                            </div>
                        )}
                        <div className="flex flex-col gap-2">
                             <label htmlFor="productImage" className="cursor-pointer bg-white dark:bg-gray-700 py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                                <span>Upload Image</span>
                                <input id="productImage" name="image" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
                            </label>
                            {currentImageUrl && (
                                <button type="button" onClick={handleRemoveImage} className="text-sm text-red-600 dark:text-red-500 hover:underline text-left">
                                    Remove
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                
                <div>
                    <label htmlFor="productDesc" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                    <textarea id="productDesc" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Product Type</label>
                    <div className="flex gap-4">
                         <label className="flex items-center"><input type="radio" name="productType" value="simple" checked={productType === 'simple'} onChange={() => setProductType('simple')} className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500" /> <span className="ml-2 text-gray-800 dark:text-gray-200">Simple Product</span></label>
                         <label className="flex items-center"><input type="radio" name="productType" value="variable" checked={productType === 'variable'} onChange={() => setProductType('variable')} className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500" /> <span className="ml-2 text-gray-800 dark:text-gray-200">Product with Variants</span></label>
                    </div>
                </div>

                {productType === 'simple' ? (
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="productPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Price</label>
                            <input id="productPrice" type="number" value={price} onChange={e => setPrice(Number(e.target.value))} required min="0" step="0.01" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                        <div>
                            <label htmlFor="productStock" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Stock Quantity</label>
                            <input id="productStock" type="number" value={stock} onChange={e => setStock(Number(e.target.value))} required min="0" step="1" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-100">Variants</h4>
                        {variants.map((variant, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end p-2 bg-gray-50 dark:bg-gray-900/50 rounded">
                                <div className="md:col-span-2">
                                    <label className="text-xs text-gray-500 dark:text-gray-400">Name</label>
                                    <input type="text" value={variant.name} onChange={e => handleVariantChange(index, 'name', e.target.value)} placeholder="e.g., Small, Blue" className="mt-1 w-full text-sm p-1.5 border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 dark:text-gray-400">Price</label>
                                    <input type="number" value={variant.price} onChange={e => handleVariantChange(index, 'price', Number(e.target.value))} min="0" step="0.01" className="mt-1 w-full text-sm p-1.5 border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" />
                                </div>
                                <div className="flex items-end gap-1">
                                    <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400">Stock</label>
                                        <input type="number" value={variant.stock_quantity} onChange={e => handleVariantChange(index, 'stock_quantity', Number(e.target.value))} min="0" step="1" className="mt-1 w-full text-sm p-1.5 border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" />
                                    </div>
                                    <button type="button" onClick={() => handleRemoveVariant(index)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded">
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={handleAddVariant} className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm border border-dashed border-gray-400 dark:border-gray-500 text-gray-700 dark:text-gray-300 font-semibold rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                            <PlusIcon className="h-4 w-4" /> Add Variant
                        </button>
                    </div>
                )}
                
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
                            {isSubmitting ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Product')}
                        </button>
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default ProductFormModal;