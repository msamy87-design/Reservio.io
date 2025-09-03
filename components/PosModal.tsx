import React, { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';
import { Booking, Service, Product, TransactionItem, NewTransactionData, Discount, Transaction } from '../types';
import { TrashIcon } from './Icons';

interface PosModalProps {
    isOpen: boolean;
    onClose: () => void;
    booking: Booking;
    services: Service[];
    products: Product[];
    onSubmit: (data: NewTransactionData) => Promise<Transaction | void>;
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const PosModal: React.FC<PosModalProps> = ({ isOpen, onClose, booking, services, products, onSubmit }) => {
    const [cart, setCart] = useState<TransactionItem[]>([]);
    const [discount, setDiscount] = useState<Discount | null>(null);
    const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
    const [discountValue, setDiscountValue] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card'>('Card');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const bookingService = useMemo(() => services.find(s => s.id === booking.service.id), [services, booking]);

    useEffect(() => {
        if (isOpen && bookingService) {
            const initialItem: TransactionItem = {
                id: bookingService.id,
                name: bookingService.name,
                type: 'service',
                quantity: 1,
                unit_price: bookingService.price,
                staffId: booking.staff.id,
                staffName: booking.staff.full_name,
            };
            setCart([initialItem]);
            setDiscount(null);
            setDiscountValue(0);
            setPaymentMethod('Card');
            setIsSubmitting(false);
        }
    }, [isOpen, booking, bookingService]);

    const subtotal = useMemo(() => cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0), [cart]);
    const discountAmount = useMemo(() => {
        if (!discount) return 0;
        return discount.type === 'percentage' ? subtotal * (discount.value / 100) : discount.value;
    }, [subtotal, discount]);
    const taxAmount = (subtotal - discountAmount) * 0.10; // 10% tax
    const total = subtotal - discountAmount + taxAmount;
    
    const handleApplyDiscount = () => {
        if (discountValue > 0) {
            setDiscount({ type: discountType, value: discountValue });
        } else {
            setDiscount(null);
        }
    };
    
    const handleAddItem = (item: Service | Product) => {
        const isService = 'duration_minutes' in item;
        const existingCartItem = cart.find(ci => ci.id === item.id);
        
        if(existingCartItem) {
            setCart(cart.map(ci => ci.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci));
        } else {
            const newItem: TransactionItem = {
                id: item.id,
                name: item.name,
                type: isService ? 'service' : 'product',
                quantity: 1,
                unit_price: item.price,
            };
            // For booking-linked POS, assume any added service is also performed by the booking's staff
            if (isService) {
                newItem.staffId = booking.staff.id;
                newItem.staffName = booking.staff.full_name;
            }
            setCart([...cart, newItem]);
        }
    };

    const handleRemoveItem = (itemId: string) => {
        setCart(cart.filter(item => item.id !== itemId));
    };

    const handleQuantityChange = (itemId: string, newQuantity: number) => {
        if (newQuantity < 1) return;
        setCart(cart.map(item => item.id === itemId ? { ...item, quantity: newQuantity } : item));
    };
    
    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const transactionData: NewTransactionData = {
                booking_id: booking.id,
                customer_id: booking.customer.id,
                items: cart,
                discount,
                payment_method: paymentMethod,
            };
            await onSubmit(transactionData);
            onClose();
        } catch (error) {
            // DataContext shows the error toast, this catch block prevents the UI from crashing
            // and allows the finally block to execute.
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Checkout for ${booking.customer.full_name}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto pr-2">
                {/* Cart Items */}
                <div className="space-y-3">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">Order Summary</h3>
                    {cart.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                            <div>
                                <p className="font-semibold text-gray-800 dark:text-gray-200">{item.name}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{formatCurrency(item.unit_price)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number" 
                                    value={item.quantity}
                                    onChange={e => handleQuantityChange(item.id, parseInt(e.target.value))}
                                    min="1"
                                    className="w-16 text-center bg-transparent border border-gray-300 dark:border-gray-600 rounded-md"
                                />
                                <button onClick={() => handleRemoveItem(item.id)} className="p-1 text-red-500 hover:text-red-700">
                                    <TrashIcon className="h-4 w-4"/>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Add Items */}
                <div className="space-y-3">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">Add to Order</h3>
                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300">Services</h4>
                        <div className="max-h-24 overflow-y-auto border rounded-md p-2 space-y-1">
                            {services.map(s => <button key={s.id} onClick={() => handleAddItem(s)} className="w-full text-left text-sm p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded">{s.name}</button>)}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300">Products</h4>
                        <div className="max-h-24 overflow-y-auto border rounded-md p-2 space-y-1">
                             {products.map(p => <button key={p.id} onClick={() => handleAddItem(p)} disabled={p.stock_quantity <= 0} className="w-full text-left text-sm p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded disabled:opacity-50">{p.name} ({p.stock_quantity} in stock)</button>)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Financial Summary & Actions */}
            <div className="mt-6 pt-4 border-t dark:border-gray-600">
                 <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-300">Subtotal</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-100">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-red-600 dark:text-red-400">
                        <span>Discount</span>
                        <span>- {formatCurrency(discountAmount)}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-300">Tax (10%)</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-100">{formatCurrency(taxAmount)}</span>
                    </div>
                     <div className="flex justify-between items-center text-xl font-bold text-gray-900 dark:text-white pt-2 border-t dark:border-gray-600 mt-2">
                        <span>Total</span>
                        <span>{formatCurrency(total)}</span>
                    </div>
                </div>
                
                <div className="mt-4 flex gap-4">
                     <select value={discountType} onChange={e => setDiscountType(e.target.value as any)} className="border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600">
                        <option value="percentage">%</option>
                        <option value="fixed">$</option>
                    </select>
                    <input type="number" value={discountValue} onChange={e => setDiscountValue(Number(e.target.value))} min="0" className="flex-grow border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                    <button onClick={handleApplyDiscount} className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-600 rounded-md">Apply</button>
                </div>

                <div className="mt-6 flex justify-between items-center">
                    <div className="flex gap-2">
                        <button onClick={() => setPaymentMethod('Card')} className={`px-4 py-2 rounded-md ${paymentMethod === 'Card' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>Card</button>
                        <button onClick={() => setPaymentMethod('Cash')} className={`px-4 py-2 rounded-md ${paymentMethod === 'Cash' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>Cash</button>
                    </div>
                    <button onClick={handleSubmit} disabled={isSubmitting || cart.length === 0} className="px-6 py-3 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 disabled:bg-green-300">
                        {isSubmitting ? 'Processing...' : `Record ${paymentMethod} Payment`}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default PosModal;