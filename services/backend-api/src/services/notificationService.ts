

import { mockBookings, mockBusinessSettings, mockCustomers } from '../data/mockData';
import { Booking } from '../../../../types';

// In a real application, this would integrate with an email service like SendGrid, Mailgun, etc.
// For now, it just logs to the console.

const sendNotification = (recipient: string, subject: string, body: string) => {
    console.log(`
--------------------------------------------------
  SENDING NOTIFICATION (SIMULATED)
--------------------------------------------------
  TO: ${recipient}
  SUBJECT: ${subject}
  
  BODY:
  ${body}
--------------------------------------------------
    `);
};

export const sendBookingConfirmation = (booking: Booking, customerEmail: string) => {
    if (!booking.business) return;
    const businessSettings = mockBusinessSettings[booking.business.id];
    
    sendNotification(
        customerEmail,
        'Your Booking is Confirmed!',
        `Hi ${booking.customer.full_name},\n\nYour appointment for ${booking.service.name} with ${booking.staff.full_name} on ${new Date(booking.start_at).toLocaleString()} is confirmed.\n\nSee you soon!\n - ${businessSettings.profile.name}`
    );

    if (businessSettings.notification_settings.new_booking_alerts) {
        sendNotification(
            businessSettings.profile.email,
            'New Online Booking!',
            `You have a new booking from ${booking.customer.full_name} for ${booking.service.name} with ${booking.staff.full_name} on ${new Date(booking.start_at).toLocaleString()}.`
        );
    }
};


export const sendCancellationConfirmation = (booking: Booking, customerEmail: string) => {
     if (!booking.business) return;
     const businessSettings = mockBusinessSettings[booking.business.id];
     
     sendNotification(
        customerEmail,
        'Your Booking has been Cancelled',
        `Hi ${booking.customer.full_name},\n\nYour appointment for ${booking.service.name} on ${new Date(booking.start_at).toLocaleString()} has been successfully cancelled.`
    );

    if (businessSettings.notification_settings.cancellation_alerts) {
        sendNotification(
            businessSettings.profile.email,
            'Booking Cancellation',
            `The booking for ${booking.customer.full_name} (${booking.service.name}) on ${new Date(booking.start_at).toLocaleString()} has been cancelled.`
        );
    }
};

export const sendAppointmentReminder = (booking: Booking, customerEmail: string) => {
    sendNotification(
        customerEmail,
        'Reminder: Your Appointment is Tomorrow',
        `Hi ${booking.customer.full_name},\n\nThis is a friendly reminder for your appointment tomorrow for ${booking.service.name} at ${new Date(booking.start_at).toLocaleTimeString()}.\n\nWe look forward to seeing you!`
    );
};

export const sendReviewRequest = (booking: Booking, customerEmail: string) => {
    sendNotification(
        customerEmail,
        'How was your recent appointment?',
        `Hi ${booking.customer.full_name},\n\nThanks for visiting us! We'd love to hear your feedback on your recent ${booking.service.name} service. Please take a moment to leave a review.\n\n[Link to review page on Reservio]`
    );
};

export const sendWaitlistNotification = (customerEmail: string, booking: Booking) => {
    sendNotification(
        customerEmail,
        'An appointment slot has opened up!',
        `Hi there,\n\nA slot for ${booking.service.name} with ${booking.staff.full_name} at ${new Date(booking.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} has become available.\n\nThis spot is in high demand! Book now before it's gone.\n\n[Link to booking page with pre-filled details]`
    );
};

export const runSimulatedCronJobs = () => {
    console.log('[cron]: Running simulated daily cron jobs...');
    // Simulate checking for appointments tomorrow to send reminders
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const upcomingBookings = mockBookings.filter(b => 
        new Date(b.start_at).toDateString() === tomorrow.toDateString() &&
        b.status === 'confirmed'
    );
    
    console.log(`[cron]: Found ${upcomingBookings.length} upcoming appointments for tomorrow.`);

    upcomingBookings.forEach(booking => {
        // In a real app, you'd check if a reminder has already been sent
        // For simplicity, we get the customer email from the booking object itself
        const customerEmail = mockCustomers.find(c => c.id === booking.customer.id)?.email || 'unknown@example.com';
        sendAppointmentReminder(booking, customerEmail);
    });
};