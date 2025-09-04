import React, { useState, useEffect, useCallback } from 'react';
import Modal from './Modal';
import { PublicBusinessProfile, PublicService, NewPublicBookingData, PublicCustomerUser } from '../types';
import { getAvailability, createPaymentIntent, createPublicBooking } from '../services/marketplaceApi';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';
import { useToast } from '../contexts/ToastContext';
import CheckoutForm from './CheckoutForm';
import WaitlistModal from './WaitlistModal';
import * as dateFns from 'date-fns';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: PublicService;
  business: PublicBusinessProfile;
  initialStaffId?: string | null;
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, service, business, initialStaffId }) => {
    const { currentCustomer } = useCustomerAuth();
    const { addToast } = useToast();
    const [step, setStep] = useState(1);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedStaffId, setSelectedStaffId] = useState(initialStaffId || 'any');
    const [availability, setAvailability] = useState<Record<string, string[]>>({});
    const [loadingAvailability, setLoadingAvailability] = useState(true);
    const [isCheckingRisk, setIsCheckingRisk] = useState(false);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [depositAmount, setDepositAmount] = useState<number>(0);
    const [depositReason, setDepositReason] = useState<string>('');
    const [customerDetails, setCustomerDetails] = useState({ fullName: '', email: '', phone: '' });
    const [isWaitlistModalOpen, setIsWaitlistModalOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (currentCustomer) {
                setCustomerDetails({ fullName: currentCustomer.full_name, email: currentCustomer.email, phone: '' });
            }
        } else {
            // Reset state on close
            setTimeout(() => {
                setStep(1);
                setSelectedDate(new Date());
                setSelectedStaffId(initialStaffId || 'any');
                setSelectedTime(null);
                setClientSecret(null);
            }, 300); // delay to allow for closing animation
        }
    }, [isOpen, currentCustomer, initialStaffId]);

    const fetchAvailability = useCallback(async () => {
        setLoadingAvailability(true);
        try {
            const data = await getAvailability(business.id, service.id, selectedStaffId, dateFns.format(selectedDate, 'yyyy-MM-dd'));
            setAvailability(data);
        } catch (error) {
            console.error("Failed to fetch availability", error);
            setAvailability({});
        } finally {
            setLoadingAvailability(false);
        }
    }, [business.id, service.id, selectedStaffId, selectedDate]);

    useEffect(() => {
        if (isOpen && step === 1) {
            fetchAvailability();
        }
    }, [isOpen, step, fetchAvailability]);
    
    const isCustomerFormValid = () => customerDetails.fullName.trim() !== '' && customerDetails.email.trim() !== '';

    const handleDirectBooking = async (staffId: string, startTime: string) => {
        if (!isCustomerFormValid()) {
            addToast("Please fill in your name and email.", "error");
            setStep(2); // Go to details form if somehow bypassed
            return;
        }
        
        const bookingData: NewPublicBookingData = {
            businessId: business.id,
            serviceId: service.id,
            staffId: staffId,
            startTime: startTime,
            customer: {
                full_name: customerDetails.fullName,
                email: customerDetails.email,
                phone: customerDetails.phone,
            },
        };
        try {
            await createPublicBooking(bookingData);
            addToast('Booking confirmed!', 'success');
            onClose();
        } catch (error) {
            addToast('Failed to create booking.', 'error');
        }
    };

    const handleTimeSelect = async (time: string, staffId: string) => {
        setSelectedTime(time);
        setSelectedStaffId(staffId);
        
        if (!currentCustomer && !isCustomerFormValid()) {
            addToast("Please fill in your name and email first.", "info");
            setStep(2); 
            return;
        }

        setIsCheckingRisk(true);
        const startTime = dateFns.parse(time, 'HH:mm', selectedDate).toISOString();

        try {
            const customerPayload = currentCustomer ? undefined : {
                full_name: customerDetails.fullName,
                email: customerDetails.email,
            };

            const { clientSecret, depositAmount, depositReason } = await createPaymentIntent({ 
                serviceId: service.id, 
                businessId: business.id, 
                staffId, 
                startTime,
                customer: customerPayload
            });

            setIsCheckingRisk(false);

            if (clientSecret) { // Deposit required
                setClientSecret(clientSecret);
                setDepositAmount(depositAmount);
                setDepositReason(depositReason);
                setStep(2);
            } else { // No deposit needed, book directly
                await handleDirectBooking(staffId, startTime);
            }
        } catch (error) {
            setIsCheckingRisk(false);
            addToast('Could not proceed with booking. Please try another time.', 'error');
        }
    };
    
    const handleBookingSuccess = () => {
        onClose();
    };

    const handleCustomerDetailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCustomerDetails({ ...customerDetails, [e.target.name]: e.target.value });
    };
    
    const availableStaffIds = Object.keys(availability);
    const availableStaff = business.staff.filter(s => availableStaffIds.includes(s.id));
    
    // MOCK DATA FALLBACK for staff assignment
    const mockServices = [{ id: 'serv_1', staffIds: ['staff_1', 'staff_2'] }, { id: 'serv_2', staffIds: ['staff_1', 'staff_2', 'staff_3'] }, { id: 'serv_3', staffIds: ['staff_2'] }, { id: 'serv_4', staffIds: ['staff_1'] }];
    const serviceStaffIds = mockServices.find(s => s.id === service.id)?.staffIds;
    const renderableStaff = serviceStaffIds ? business.staff.filter(s => serviceStaffIds.includes(s.id)) : business.staff;

    return (
        <>
        <Modal isOpen={isOpen} onClose={onClose} title={`Book: ${service.name}`}>
            {step === 1 && (
                <div className="relative">
                    {isCheckingRisk && (
                        <div className="absolute inset-0 bg-white/70 dark:bg-gray-800/70 z-10 flex flex-col items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">Checking availability...</p>
                        </div>
                    )}
                    {/* Date and Staff Selector */}
                    <div className="flex justify-between items-center mb-4">
                        <button onClick={() => setSelectedDate(d => dateFns.addDays(d, -1))} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><ChevronLeftIcon className="h-5 w-5"/></button>
                        <span className="font-semibold text-lg">{dateFns.format(selectedDate, 'EEEE, MMMM d')}</span>
                        <button onClick={() => setSelectedDate(d => dateFns.addDays(d, 1))} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><ChevronRightIcon className="h-5 w-5"/></button>
                    </div>
                    <select value={selectedStaffId} onChange={e => setSelectedStaffId(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 mb-4">
                        <option value="any">Any Available</option>
                        {renderableStaff.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                    </select>

                    {!currentCustomer && (
                         <div className="space-y-2 mb-4 p-3 border rounded-md dark:border-gray-600">
                            <h3 className="text-sm font-semibold">Your Details</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <input type="text" name="fullName" placeholder="Full Name" value={customerDetails.fullName} onChange={handleCustomerDetailChange} className="w-full text-sm p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required />
                                <input type="email" name="email" placeholder="Email" value={customerDetails.email} onChange={handleCustomerDetailChange} className="w-full text-sm p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required />
                            </div>
                        </div>
                    )}
                    
                    {/* Availability */}
                    <div className="max-h-64 overflow-y-auto">
                        {loadingAvailability ? <p>Loading availability...</p> : (
                           availableStaff.length > 0 ? availableStaff.map(staff => (
                               <div key={staff.id} className="mb-4">
                                   <h4 className="font-semibold">{staff.full_name}</h4>
                                   <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                                       {availability[staff.id]?.map(time => (
                                           <button key={time} onClick={() => handleTimeSelect(time, staff.id)} className="p-2 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 rounded-md hover:bg-indigo-600 hover:text-white">
                                               {dateFns.format(dateFns.parse(time, 'HH:mm', new Date()), 'h:mm a')}
                                           </button>
                                       ))}
                                   </div>
                               </div>
                           )) : (
                               <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <p className="font-semibold">No appointments available on this day.</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Try another date or join the waitlist.</p>
                                    <button onClick={() => setIsWaitlistModalOpen(true)} className="mt-3 px-4 py-2 text-sm bg-indigo-600 text-white rounded-md">Join Waitlist</button>
                               </div>
                           )
                        )}
                    </div>
                </div>
            )}
            {step === 2 && (
                <div>
                    <button onClick={() => setStep(1)} className="text-sm text-indigo-600 mb-4">&larr; Back to time selection</button>
                    {!currentCustomer && (
                        <div className="space-y-4 mb-4 p-4 border rounded-md dark:border-gray-600">
                            <h3 className="font-semibold">Your Details</h3>
                            <input type="text" name="fullName" placeholder="Full Name" value={customerDetails.fullName} onChange={handleCustomerDetailChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required />
                            <input type="email" name="email" placeholder="Email" value={customerDetails.email} onChange={handleCustomerDetailChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required />
                            <input type="tel" name="phone" placeholder="Phone (Optional)" value={customerDetails.phone} onChange={handleCustomerDetailChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                    )}
                    {depositAmount > 0 && (
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-lg mb-4">
                            <p className="font-bold">Deposit Required: ${depositAmount.toFixed(2)}</p>
                            <p className="text-sm mt-1">{depositReason}</p>
                        </div>
                    )}
                    {clientSecret && isCustomerFormValid() && <CheckoutForm clientSecret={clientSecret} bookingData={{ businessId: business.id, serviceId: service.id, staffId: selectedStaffId, startTime: dateFns.parse(selectedTime!, 'HH:mm', selectedDate).toISOString(), customer: { full_name: customerDetails.fullName, email: customerDetails.email, phone: customerDetails.phone } }} onSuccess={handleBookingSuccess} />}
                </div>
            )}
        </Modal>
        <WaitlistModal 
            isOpen={isWaitlistModalOpen}
            onClose={() => setIsWaitlistModalOpen(false)}
            businessId={business.id}
            serviceId={service.id}
            date={selectedDate}
        />
        </>
    );
};
// Dummy mock services for fallback
const mockServices = [{ id: 'serv_1', staffIds: ['staff_1', 'staff_2'] }, { id: 'serv_2', staffIds: ['staff_1', 'staff_2', 'staff_3'] }, { id: 'serv_3', staffIds: ['staff_2'] }, { id: 'serv_4', staffIds: ['staff_1'] }];


export default BookingModal;