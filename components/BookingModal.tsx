import React, { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';
import { PublicBusinessProfile, PublicService, PublicStaff, NewPublicBookingData } from '../types';
import { getAvailability, createPaymentIntent } from '../services/marketplaceApi';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';
import { ChevronLeftIcon, CheckIcon, CreditCardIcon, CalendarDaysIcon, ClockIcon, UserCircleIcon } from './Icons';
import * as dateFns from 'date-fns';
import { useToast } from '../contexts/ToastContext';
import CheckoutForm from './CheckoutForm';

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    service: PublicService;
    business: PublicBusinessProfile;
    initialStaffId?: string | null;
}

type BookingStep = 'staff' | 'dateTime' | 'details' | 'payment' | 'confirmation';
type AnyStaff = { id: 'any'; full_name: string; role: 'Stylist' };

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, service, business, initialStaffId }) => {
    const { currentCustomer } = useCustomerAuth();
    const { addToast } = useToast();

    const [step, setStep] = useState<BookingStep>('staff');
    const [selectedStaff, setSelectedStaff] = useState<PublicStaff | null>(null);
    const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [availableTimes, setAvailableTimes] = useState<Record<string, string[]>>({});
    const [isLoadingTimes, setIsLoadingTimes] = useState(false);
    
    const [customerDetails, setCustomerDetails] = useState({ name: '', email: '', phone: '' });
    const [clientSecret, setClientSecret] = useState<string | null>(null);

    useEffect(() => {
        if (currentCustomer) {
            setCustomerDetails({
                name: currentCustomer.full_name,
                email: currentCustomer.email,
                phone: '', // Assuming phone is not in PublicCustomerUser
            });
        }
    }, [currentCustomer]);
    
    useEffect(() => {
        if (isOpen) {
            // Reset state when modal opens
            if (initialStaffId) {
                const staff = business.staff.find(s => s.id === initialStaffId);
                setSelectedStaff(staff || null);
                setSelectedStaffId(initialStaffId);
                setStep('dateTime');
            } else if (business.staff.length === 1) {
                setStep('dateTime');
                setSelectedStaff(business.staff[0]);
                setSelectedStaffId(business.staff[0].id);
            } else {
                setStep('staff');
                setSelectedStaff(null);
                setSelectedStaffId(null);
            }
            setSelectedDate(new Date());
            setSelectedTime(null);
            setClientSecret(null);
        }
    }, [isOpen, business.staff, initialStaffId]);

    useEffect(() => {
        const fetchTimes = async () => {
            if (selectedStaffId && selectedDate) {
                setIsLoadingTimes(true);
                setSelectedTime(null);
                try {
                    const times = await getAvailability(business.id, service.id, selectedStaffId, dateFns.format(selectedDate, 'yyyy-MM-dd'));
                    setAvailableTimes(times);
                } catch (error) {
                    console.error("Failed to fetch availability", error);
                    setAvailableTimes({});
                } finally {
                    setIsLoadingTimes(false);
                }
            }
        };
        fetchTimes();
    }, [selectedStaffId, selectedDate, business.id, service.id]);
    
    const weekDays = useMemo(() => {
        const start = dateFns.startOfWeek(selectedDate);
        return Array.from({ length: 7 }).map((_, i) => dateFns.addDays(start, i));
    }, [selectedDate]);

    const handleNextStep = async () => {
        if (step === 'dateTime') {
             if (currentCustomer) {
                setStep('payment');
            } else {
                setStep('details');
            }
        } else if (step === 'details') {
            setStep('payment');
        }
    };
    
    useEffect(() => {
        const fetchPaymentIntent = async () => {
            if (step === 'payment' && !clientSecret) {
                try {
                    const { clientSecret } = await createPaymentIntent(service.id);
                    setClientSecret(clientSecret);
                } catch (error) {
                    addToast('Could not initialize payment.', 'error');
                    setStep('details'); // Go back
                }
            }
        };
        fetchPaymentIntent();
    }, [step, clientSecret, service.id, addToast]);

    const handlePrevStep = () => {
        if (step === 'dateTime') {
            if (initialStaffId) {
                 onClose(); // If pre-selected via rebook, just close
            } else {
                setStep(business.staff.length > 1 ? 'staff' : 'staff')
            }
        }
        else if (step === 'details') setStep('dateTime');
        else if (step === 'payment') {
            if (currentCustomer) setStep('dateTime');
            else setStep('details');
        }
    };
    
    const handleStaffSelect = (staff: PublicStaff | AnyStaff) => {
        setSelectedStaffId(staff.id);
        if (staff.id === 'any') {
            setSelectedStaff(null);
        } else {
            setSelectedStaff(staff as PublicStaff);
        }
        setStep('dateTime');
    };

    const handleTimeSelect = (timeSlot: string) => {
        setSelectedTime(timeSlot);

        if (selectedStaffId === 'any') {
            const availableStaffIds = availableTimes[timeSlot];
            if (availableStaffIds && availableStaffIds.length > 0) {
                const assignedStaff = business.staff.find(s => s.id === availableStaffIds[0]);
                if (assignedStaff) {
                    setSelectedStaff(assignedStaff);
                }
            }
        }
    };
    
    const staffOptions: (PublicStaff | AnyStaff)[] = [
        { id: 'any', full_name: 'Any Available Professional', role: 'Stylist' },
        ...business.staff
    ];

    const renderStep = () => {
        switch(step) {
            case 'staff':
                return (
                    <div>
                        <h3 className="text-lg font-semibold text-center text-gray-800 dark:text-gray-100 mb-4">Select a Staff Member</h3>
                        <div className="space-y-2">
                            {staffOptions.map(staff => (
                                <button key={staff.id} onClick={() => handleStaffSelect(staff)} className="w-full text-left p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600">
                                    <p className="font-semibold">{staff.full_name}</p>
                                    {staff.id !== 'any' && <p className="text-xs text-gray-500 dark:text-gray-400">{staff.role}</p>}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 'dateTime':
                return (
                    <div>
                        <h3 className="text-lg font-semibold text-center text-gray-800 dark:text-gray-100 mb-4">Select Date & Time</h3>
                        {/* Date Picker */}
                        <div className="flex items-center justify-between mb-4">
                            <button onClick={() => setSelectedDate(dateFns.subWeeks(selectedDate, 1))} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><ChevronLeftIcon className="h-5 w-5"/></button>
                            <span className="font-semibold">{dateFns.format(selectedDate, 'MMMM yyyy')}</span>
                            <button onClick={() => setSelectedDate(dateFns.addWeeks(selectedDate, 1))} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><ChevronLeftIcon className="h-5 w-5 rotate-180"/></button>
                        </div>
                        <div className="grid grid-cols-7 text-center text-sm gap-1 mb-4">
                            {weekDays.map(day => (
                                <div key={day.toString()} onClick={() => setSelectedDate(day)} className={`p-2 rounded-lg cursor-pointer ${dateFns.isSameDay(day, selectedDate) ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                    <p className="text-xs">{dateFns.format(day, 'EEE')}</p>
                                    <p>{dateFns.format(day, 'd')}</p>
                                </div>
                            ))}
                        </div>
                        {/* Time Picker */}
                        <div className="max-h-48 overflow-y-auto grid grid-cols-3 gap-2">
                            {isLoadingTimes ? <p>Loading times...</p> : Object.keys(availableTimes).length === 0 ? <p className="col-span-3 text-center text-sm text-gray-500">No available times.</p> : Object.keys(availableTimes).sort().map(timeSlot => (
                                <button key={timeSlot} onClick={() => handleTimeSelect(timeSlot)} className={`p-2 rounded-md text-sm ${selectedTime === timeSlot ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                                    {timeSlot}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 'details':
                 return (
                    <div>
                        <h3 className="text-lg font-semibold text-center text-gray-800 dark:text-gray-100 mb-4">Your Information</h3>
                         <div className="space-y-4">
                            <input type="text" placeholder="Full Name" value={customerDetails.name} onChange={e => setCustomerDetails({...customerDetails, name: e.target.value})} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                            <input type="email" placeholder="Email" value={customerDetails.email} onChange={e => setCustomerDetails({...customerDetails, email: e.target.value})} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                            <input type="tel" placeholder="Phone Number" value={customerDetails.phone} onChange={e => setCustomerDetails({...customerDetails, phone: e.target.value})} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                         </div>
                    </div>
                );
            case 'payment':
                return (
                    <div>
                        <h3 className="text-lg font-semibold text-center text-gray-800 dark:text-gray-100 mb-4">Payment Details</h3>
                        {clientSecret ? (
                            <CheckoutForm 
                                clientSecret={clientSecret}
                                bookingData={{
                                    businessId: business.id,
                                    serviceId: service.id,
                                    staffId: selectedStaff!.id,
                                    startTime: new Date(`${dateFns.format(selectedDate, 'yyyy-MM-dd')}T${selectedTime}`).toISOString(),
                                    customer: { full_name: customerDetails.name, email: customerDetails.email, phone: customerDetails.phone },
                                }}
                                onSuccess={() => setStep('confirmation')}
                            />
                        ) : (
                            <div className="text-center">Loading payment form...</div>
                        )}
                    </div>
                );
            case 'confirmation':
                return (
                    <div className="text-center">
                        <CheckIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Booking Confirmed!</h3>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">Your appointment is scheduled. You'll receive a confirmation email shortly.</p>
                        <button onClick={onClose} className="mt-6 w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700">
                            Done
                        </button>
                    </div>
                );
        }
    };

    const isNextDisabled = 
        (step === 'staff' && !selectedStaffId) ||
        (step === 'dateTime' && !selectedTime) ||
        (step === 'details' && (!customerDetails.name || !customerDetails.email || !customerDetails.phone));

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="">
            <div className="p-2">
                {/* Header */}
                <div className="mb-4 pb-4 border-b dark:border-gray-600">
                    <h2 className="text-xl font-bold">{service.name}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{business.name}</p>
                    <div className="mt-2 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2"><CalendarDaysIcon className="h-4 w-4" /><span>{selectedDate ? dateFns.format(selectedDate, 'EEE, MMM d') : '...'}</span></div>
                        <div className="flex items-center gap-2"><ClockIcon className="h-4 w-4" /><span>{selectedTime || '...'}</span></div>
                        <div className="flex items-center gap-2"><UserCircleIcon className="h-4 w-4" /><span>{selectedStaff?.full_name || (selectedStaffId === 'any' ? 'Any Available' : '...')}</span></div>
                        <div className="font-bold text-lg">${service.price.toFixed(2)}</div>
                    </div>
                </div>
                
                {/* Step Content */}
                <div className="min-h-[250px]">
                    {renderStep()}
                </div>

                {/* Footer */}
                {step !== 'confirmation' && (
                    <div className="mt-6 flex justify-between items-center">
                        <button onClick={handlePrevStep} disabled={step==='staff' || (step === 'dateTime' && (business.staff.length <= 1 || !!initialStaffId)) } className="px-4 py-2 text-sm font-semibold rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50">
                            Back
                        </button>
                        <button onClick={handleNextStep} disabled={isNextDisabled} className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300 dark:disabled:bg-indigo-800">
                            Next
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default BookingModal;