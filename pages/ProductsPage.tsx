

import React, { useState, useMemo, Fragment } from 'react';
import { useData } from '../contexts/DataContext';
import { Product, NewProductData, ProductVariant } from '../types';
import Pagination from '../components/Pagination';
import ProductFormModal from '../components/ProductFormModal';
import ImportProductsModal from '../components/ImportProductsModal';
import { PlusIcon, SearchIcon, ArchiveBoxIcon, ChevronDownIcon } from '../components/Icons';

const ITEMS_PER_PAGE = 10;

const StatCard: React.FC<{ title: string; value: string | number; isLoading: boolean }> = ({ title, value, isLoading }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</h3>
    {isLoading ? (
      <div className="mt-2 h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
    ) : (
      <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-2">{value}</p>
    )}
  </div>
);

const ProductsPage: React.FC = () => {
    const { products, loading: isLoading, createProduct, updateProduct, deleteProduct, createProductsBulk } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedProductIds, setExpandedProductIds] = useState<Set<string>>(new Set());

    const inventoryStats = useMemo(() => {
        if (!products) return { totalProducts: 0, lowStockCount: 0, outOfStockCount: 0, totalValue: 0 };
        const lowStockCount = products.filter(p => {
             if (p.variants && p.variants.length > 0) {
                return p.variants.some(v => v.stock_quantity > 0 && v.stock_quantity <= 10);
            }
            return p.stock_quantity > 0 && p.stock_quantity <= 10
        }).length;
        const outOfStockCount = products.filter(p => p.stock_quantity === 0).length;
        const totalValue = products.reduce((acc, p) => {
            if (p.variants && p.variants.length > 0) {
                const variantsValue = p.variants.reduce((vAcc, v) => vAcc + v.price * v.stock_quantity, 0);
                return acc + variantsValue;
            }
            return acc + p.price * p.stock_quantity;
        }, 0);

        return {
            totalProducts: products.length,
            lowStockCount,
            outOfStockCount,
            totalValue,
        };
    }, [products]);

    const filteredProducts = useMemo(() => {
        return products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [products, searchTerm]);

    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

    const paginatedProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredProducts, currentPage]);

    const handleOpenModal = (product: Product | null = null) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setSelectedProduct(null);
        setIsModalOpen(false);
    };

    const handleSave = async (data: NewProductData, id?: string) => {
        if (id) {
            await updateProduct(id, data);
        } else {
            await createProduct(data);
        }
        handleCloseModal();
    };
    
    const handleBulkImport = async (newProducts: NewProductData[]) => {
        if (newProducts.length === 0) return;
        await createProductsBulk(newProducts);
    };

    const handleDelete = async (id: string) => {
        await deleteProduct(id);
        handleCloseModal();
    };
    
    const toggleRow = (productId: string) => {
        setExpandedProductIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(productId)) {
                newSet.delete(productId);
            } else {
                newSet.add(productId);
            }
            return newSet;
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const formatPriceRange = (variants: ProductVariant[]) => {
        if (!variants || variants.length === 0) return '';
        const prices = variants.map(v => v.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        if (minPrice === maxPrice) return formatCurrency(minPrice);
        return `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`;
    };

    return (
        <>
            <div>
                <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Inventory</h2>
                        <p className="mt-1 text-gray-600 dark:text-gray-400">Manage your retail products and stock levels.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard title="Total Products" value={inventoryStats.totalProducts} isLoading={isLoading} />
                    <StatCard title="Low Stock Items" value={inventoryStats.lowStockCount} isLoading={isLoading} />
                    <StatCard title="Out of Stock" value={inventoryStats.outOfStockCount} isLoading={isLoading} />
                    <StatCard title="Total Inventory Value" value={formatCurrency(inventoryStats.totalValue)} isLoading={isLoading} />
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <div className="relative flex-grow sm:flex-grow-0 w-full sm:max-w-xs">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <SearchIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                     <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-4 py-2 bg-white text-gray-700 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 font-semibold rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none"
                        >
                            Import Products
                        </button>
                        <button
                            onClick={() => handleOpenModal()}
                            className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <PlusIcon className="h-5 w-5" />
                            <span className="hidden sm:inline">New Product</span>
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <th scope="col" className="px-6 py-3 w-1/2">Product</th>
                                    <th scope="col" className="px-6 py-3">Price</th>
                                    <th scope="col" className="px-6 py-3 text-center">Total Stock</th>
                                    <th scope="col" className="px-6 py-3"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr><td colSpan={4} className="text-center py-10">Loading products...</td></tr>
                                ) : paginatedProducts.length === 0 ? (
                                    <tr><td colSpan={4} className="text-center py-10">No products found.</td></tr>
                                ) : (
                                    paginatedProducts.map(p => {
                                        const isVariable = p.variants && p.variants.length > 0;
                                        const isExpanded = expandedProductIds.has(p.id);
                                        return (
                                        <Fragment key={p.id}>
                                            <tr className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        {isVariable && (
                                                          <button onClick={() => toggleRow(p.id)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                                                              <ChevronDownIcon className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                          </button>
                                                        )}
                                                        {p.imageUrl ? (
                                                            <img src={p.imageUrl} alt={p.name} className="h-12 w-12 rounded-md object-cover flex-shrink-0" />
                                                        ) : (
                                                            <div className="h-12 w-12 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 flex-shrink-0">
                                                                <ArchiveBoxIcon className="h-6 w-6" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="font-medium text-gray-900 dark:text-white">{p.name}</div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">{p.description}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">{isVariable ? formatPriceRange(p.variants!) : formatCurrency(p.price)}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={p.stock_quantity === 0 ? 'text-red-500 font-semibold' : p.stock_quantity <= 10 ? 'text-yellow-500 font-semibold' : ''}>
                                                        {p.stock_quantity}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={() => handleOpenModal(p)} className="font-medium text-indigo-600 dark:text-indigo-500 hover:underline">Edit</button>
                                                </td>
                                            </tr>
                                            {isVariable && isExpanded && (
                                                <tr className="bg-gray-50 dark:bg-gray-900/50">
                                                    <td colSpan={4} className="p-0">
                                                        <div className="px-8 py-4">
                                                          <table className="w-full text-xs">
                                                              <thead className="text-gray-500 dark:text-gray-400">
                                                                <tr>
                                                                    <th className="py-2 text-left w-1/2">Variant</th>
                                                                    <th className="py-2 text-left">Price</th>
                                                                    <th className="py-2 text-center">Stock</th>
                                                                </tr>
                                                              </thead>
                                                              <tbody>
                                                                {p.variants!.map(variant => (
                                                                <tr key={variant.id} className="border-t border-gray-200 dark:border-gray-700">
                                                                    <td className="py-2 text-gray-800 dark:text-gray-200">{variant.name}</td>
                                                                    <td className="py-2 text-gray-600 dark:text-gray-300">{formatCurrency(variant.price)}</td>
                                                                    <td className="py-2 text-center">
                                                                        <div className="flex items-center justify-center gap-2" title={
                                                                            variant.stock_quantity === 0 ? 'Out of stock' :
                                                                            variant.stock_quantity > 0 && variant.stock_quantity <= 10 ? 'Low stock' : 'In stock'
                                                                        }>
                                                                            <span className={`h-2 w-2 rounded-full ${
                                                                                variant.stock_quantity === 0 ? 'bg-red-500' :
                                                                                variant.stock_quantity <= 10 ? 'bg-yellow-500' : 'bg-green-500'
                                                                            }`}></span>
                                                                            <span className={
                                                                                variant.stock_quantity === 0 ? 'text-red-500 font-semibold' :
                                                                                variant.stock_quantity <= 10 ? 'text-yellow-500 font-semibold' : ''
                                                                            }>
                                                                                {variant.stock_quantity}
                                                                            </span>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                                ))}
                                                              </tbody>
                                                          </table>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    ))
                                )}
                              </tbody>
                        </table>
                    </div>
                    {totalPages > 1 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    )}
                </div>
            </div>
            <ProductFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSave}
                onDelete={handleDelete}
                initialData={selectedProduct}
            />
            <ImportProductsModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={handleBulkImport}
            />
        </>
    );
};

export default ProductsPage;