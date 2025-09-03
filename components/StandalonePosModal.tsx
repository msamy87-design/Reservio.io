import React, { useState, useMemo } from 'react';
import Modal from './Modal';
import { Customer, Service, Product, Staff, TransactionItem, NewTransactionData, Discount, Transaction, NewCustomerData } from '../types';
import { TrashIcon, PlusIcon, UserCircleIcon, SearchIcon } from './Icons';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import CustomerFormModal from './CustomerFormModal';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

interface StandalonePosModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const StandalonePosModal: React.FC<StandalonePosModalProps> = ({ isOpen, onClose }) => {
    const { services, products, customers, staff, createTransaction, createCustomer } = useData();
    const { addToast } = useToast();
    const [cart, setCart] = useState<TransactionItem[]>([]);
    const [discount, setDiscount] = useState<Discount | null>(null);
    const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
    const [discountValue, setDiscountValue] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card'>('Card');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [customerSearch, setCustomerSearch] = useState('');
    
    const [serviceToAdd, setServiceToAdd] = useState<Service | null>(null);
    const [isStaffSelectOpen, setIsStaffSelectOpen] = useState(false);

    const filteredCustomers = useMemo(() => {
        if (!customerSearch) return [];
        return customers.filter(c => c.full_name.toLowerCase().includes(customerSearch.toLowerCase()));
    }, [customers, customerSearch]);

    const subtotal = useMemo(() => cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0), [cart]);
    const discountAmount = useMemo(() => {
        if (!discount) return 0;
        return discount.type === 'percentage' ? subtotal * (discount.value / 100) : discount.value;
    }, [subtotal, discount]);
    const taxAmount = (subtotal - discountAmount) * 0.10; // 10% tax
    const total = subtotal - discountAmount + taxAmount;

    const resetState = () => {
        setCart([]);
        setDiscount(null);
        setDiscountValue(0);
        setPaymentMethod('Card');
        setIsSubmitting(false);
        setSelectedCustomer(null);
        setCustomerSearch('');
    };

    const handleClose = () => {
        resetState();
        onClose();
    };
    
    const handleApplyDiscount = () => {
        if (discountValue > 0) {
            setDiscount({ type: discountType, value: discountValue });
        } else {
            setDiscount(null);
        }
    };
    
    const handleAddItem = (item: Service | Product) => {
        const isService = 'duration_minutes' in item;

        if (isService) {
            setServiceToAdd(item as Service);
            setIsStaffSelectOpen(true);
        } else {
            const existingCartItem = cart.find(ci => ci.id === item.id);
            if (existingCartItem) {
                setCart(cart.map(ci => ci.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci));
            } else {
                const newItem: TransactionItem = {
                    id: item.id,
                    name: item.name,
                    type: 'product',
                    quantity: 1,
                    unit_price: item.price,
                };
                setCart([...cart, newItem]);
            }
        }
    };
    
    const handleStaffSelectedForService = (staffMember: Staff) => {
        if (!serviceToAdd) return;

        const newItem: TransactionItem = {
            id: serviceToAdd.id,
            name: serviceToAdd.name,
            type: 'service',
            quantity: 1,
            unit_price: serviceToAdd.price,
            staffId: staffMember.id,
            staffName: staffMember.full_name,
        };
        setCart([...cart, newItem]);

        // Reset state
        setIsStaffSelectOpen(false);
        setServiceToAdd(null);
    };

    const handleRemoveItem = (itemId: string, staffId?: string) => {
        setCart(cart.filter(item => !(item.id === itemId && item.staffId === staffId)));
    };

    const handleQuantityChange = (itemId: string, staffId: string | undefined, newQuantity: number) => {
        if (newQuantity < 1) return;
        setCart(cart.map(item => (item.id === itemId && item.staffId === staffId) ? { ...item, quantity: newQuantity } : item));
    };
    
    const handleSubmit = async () => {
        if (!selectedCustomer) {
            addToast('Please select a customer.', 'error');
            return;
        }
        setIsSubmitting(true);
        try {
            const transactionData: NewTransactionData = {
                booking_id: null,
                customer_id: selectedCustomer.id,
                items: cart,
                discount,
                payment_method: paymentMethod,
            };
            await createTransaction(transactionData);
            handleClose();
        } catch (error) {
             // DataContext shows the error toast, this catch block prevents the UI from crashing
            // and allows the finally block to execute.
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateCustomerSuccess = (newCustomer: Customer) => {
        setSelectedCustomer(newCustomer);
        setIsCustomerModalOpen(false);
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={handleClose} title="Standalone Point of Sale">
                <div className="space-y-4">
                    {/* Customer Selection */}
                    {!selectedCustomer ? (
                        <div className="p-4 border rounded-lg dark:border-gray-600">
                             <div className="flex justify-between items-center">
                                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">Select Customer</h3>
                                <button onClick={() => setIsCustomerModalOpen(true)} className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline">
                                    <PlusIcon className="h-4 w-4" /> New Customer
                                </button>
                            </div>
                            <div className="relative mt-2">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <SearchIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                type="text"
                                placeholder="Search existing customers..."
                                value={customerSearch}
                                onChange={e => setCustomerSearch(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
                                />
                            </div>
                            {customerSearch && (
                                <ul className="mt-2 border rounded-md max-h-32 overflow-y-auto dark:border-gray-600">
                                {filteredCustomers.map(c => (
                                    <li key={c.id} onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); }}
                                        className="p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 border-b dark:border-gray-700 last:border-b-0">
                                        {c.full_name}
                                    </li>
                                ))}
                                </ul>
                            )}
                        </div>
                    ) : (
                         <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <UserCircleIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400"/>
                                <div>
                                    <p className="font-semibold text-indigo-800 dark:text-indigo-200">{selectedCustomer.full_name}</p>
                                    <p className="text-xs text-indigo-600 dark:text-indigo-300">{selectedCustomer.email}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedCustomer(null)} className="text-sm text-gray-600 dark:text-gray-400 hover:underline">Change</button>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[50vh] overflow-y-auto pr-2">
                        <div className="space-y-3">
                            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">Order Summary</h3>
                            {cart.length === 0 ? <p className="text-sm text-gray-500">Cart is empty.</p> : cart.map((item, index) => (
                                <div key={`${item.id}-${index}`} className="flex items-start justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-gray-200">{item.name}</p>
                                        {item.staffName && <p className="text-xs text-gray-500 dark:text-gray-400">with {item.staffName}</p>}
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{formatCurrency(item.unit_price)}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input type="number" value={item.quantity} onChange={e => handleQuantityChange(item.id, item.staffId, parseInt(e.target.value))} min="1" className="w-16 text-center bg-transparent border border-gray-300 dark:border-gray-600 rounded-md" />
                                        <button onClick={() => handleRemoveItem(item.id, item.staffId)} className="p-1 text-red-500 hover:text-red-700">
                                            <TrashIcon className="h-4 w-4"/>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">Add to Order</h3>
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300">Services</h4>
                                <div className="max-h-24 overflow-y-auto border rounded-md p-2 space-y-1 dark:border-gray-600">
                                    {services.map(s => <button key={s.id} onClick={() => handleAddItem(s)} className="w-full text-left text-sm p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded">{s.name}</button>)}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300">Products</h4>
                                <div className="max-h-24 overflow-y-auto border rounded-md p-2 space-y-1 dark:border-gray-600">
                                    {products.map(p => <button key={p.id} onClick={() => handleAddItem(p)} disabled={p.stock_quantity <= 0} className="w-full text-left text-sm p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded disabled:opacity-50">{p.name} ({p.stock_quantity} in stock)</button>)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t dark:border-gray-600">
                        <div className="space-y-2">
                           <div className="flex justify-between items-center"><span className="text-gray-600 dark:text-gray-300">Subtotal</span><span className="font-semibold text-gray-800 dark:text-gray-100">{formatCurrency(subtotal)}</span></div>
                           <div className="flex justify-between items-center text-red-600 dark:text-red-400"><span>Discount</span><span>- {formatCurrency(discountAmount)}</span></div>
                           <div className="flex justify-between items-center"><span className="text-gray-600 dark:text-gray-300">Tax (10%)</span><span className="font-semibold text-gray-800 dark:text-gray-100">{formatCurrency(taxAmount)}</span></div>
                           <div className="flex justify-between items-center text-xl font-bold text-gray-900 dark:text-white pt-2 border-t dark:border-gray-600 mt-2"><span>Total</span><span>{formatCurrency(total)}</span></div>
                        </div>
                        <div className="mt-4 flex gap-4">
                            <select value={discountType} onChange={e => setDiscountType(e.target.value as any)} className="border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"><option value="percentage">%</option><option value="fixed">$</option></select>
                            <input type="number" value={discountValue} onChange={e => setDiscountValue(Number(e.target.value))} min="0" className="flex-grow border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                            <button onClick={handleApplyDiscount} className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-600 rounded-md">Apply</button>
                        </div>
                        <div className="mt-6 flex justify-between items-center">
                            <div className="flex gap-2">
                                <button onClick={() => setPaymentMethod('Card')} className={`px-4 py-2 rounded-md ${paymentMethod === 'Card' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>Card</button>
                                <button onClick={() => setPaymentMethod('Cash')} className={`px-4 py-2 rounded-md ${paymentMethod === 'Cash' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>Cash</button>
                            </div>
                            <button onClick={handleSubmit} disabled={isSubmitting || cart.length === 0 || !selectedCustomer} className="px-6 py-3 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 disabled:bg-green-300">
                                {isSubmitting ? 'Processing...' : `Record ${paymentMethod} Payment`}
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
            
             <Modal 
                isOpen={isStaffSelectOpen} 
                onClose={() => {
                    setIsStaffSelectOpen(false);
                    setServiceToAdd(null);
                }} 
                title={`Who performed "${serviceToAdd?.name}"?`}
            >
                <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Please select the staff member who provided this service.</p>
                    <div className="max-h-60 overflow-y-auto space-y-2 pt-2">
                        {staff.map(s => (
                            <button
                                key={s.id}
                                onClick={() => handleStaffSelectedForService(s)}
                                className="w-full text-left p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600"
                            >
                                <p className="font-semibold text-gray-800 dark:text-gray-200">{s.full_name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{s.role}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </Modal>

             <CustomerFormModal
                isOpen={isCustomerModalOpen}
                onClose={() => setIsCustomerModalOpen(false)}
                onSubmit={createCustomer as (data: NewCustomerData, id?: string) => Promise<Customer | void>}
                initialCustomerData={null}
                onSuccess={handleCreateCustomerSuccess}
             />
        </>
    );
};

export default StandalonePosModal;