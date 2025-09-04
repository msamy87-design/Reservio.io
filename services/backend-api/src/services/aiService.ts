import { GoogleGenAI, Type } from "@google/genai";
import { Booking } from "../../../../types";
import { mockWaitlist } from "../data/mockData";
import { sendWaitlistNotification } from "./notificationService";
import * as dateFns from 'date-fns';

if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. AI services will be disabled.");
}

const ai = process.env.API_KEY ? new GoogleGenAI({ apiKey: process.env.API_KEY }) : null;

interface NoShowRiskPayload {
    serviceId: string;
    staffId: string;
    startTime: string;
    customer: {
        full_name: string;
        email: string;
    };
}

/**
 * Uses Gemini to predict the no-show risk for a booking.
 */
export const getNoShowRiskScore = async (payload: NoShowRiskPayload): Promise<number> => {
    if (!ai) {
        console.log("AI service disabled. Returning low-risk score.");
        return 2; // Default low risk score
    }

    const prompt = `
        Analyze the following booking details and provide a no-show risk score from 1 (very low risk) to 10 (very high risk).
        Consider factors like time of day, day of the week, and whether it's a new customer.
        - Service ID: ${payload.serviceId}
        - Staff ID: ${payload.staffId}
        - Start Time: ${payload.startTime}
        - Customer Name: ${payload.customer.full_name}
        - Customer Email: ${payload.customer.email}

        Return ONLY a JSON object with a single key "riskScore" and a number value.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        riskScore: { type: Type.INTEGER }
                    },
                },
            },
        });
        
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        
        if (typeof result.riskScore === 'number') {
            console.log(`[aiService] Gemini no-show risk score: ${result.riskScore}`);
            return result.riskScore;
        }

    } catch (error) {
        console.error("Error calling Gemini API for risk score:", error);
    }
    
    // Fallback to a random score on error
    return Math.floor(Math.random() * 5) + 1;
};

/**
 * Finds and notifies customers on the waitlist when a booking is cancelled.
 */
export const findAndNotifyWaitlistMatches = (cancelledBooking: Booking) => {
    const cancelledDate = new Date(cancelledBooking.start_at);
    const cancelledDateStr = dateFns.format(cancelledDate, 'yyyy-MM-dd');
    const cancelledHour = cancelledDate.getHours();

    const timeRangeMap: Record<string, (hour: number) => boolean> = {
        'any': () => true,
        'morning': (hour) => hour >= 8 && hour < 12,
        'afternoon': (hour) => hour >= 12 && hour < 17,
        'evening': (hour) => hour >= 17 && hour < 22,
    };
    
    const matches = mockWaitlist.filter(entry => 
        entry.businessId === cancelledBooking.business?.id &&
        entry.serviceId === cancelledBooking.service.id &&
        entry.date === cancelledDateStr &&
        timeRangeMap[entry.preferredTimeRange](cancelledHour)
    );
    
    console.log(`[aiService] Found ${matches.length} waitlist matches for cancelled booking ${cancelledBooking.id}`);

    // Notify the first 3 matches (in a real app, this logic would be more sophisticated)
    matches.slice(0, 3).forEach(match => {
        sendWaitlistNotification(match.customerEmail, cancelledBooking);
    });

    // Clean up notified entries from waitlist
    const notifiedIds = new Set(matches.slice(0, 3).map(m => m.id));
    // This is a mock; in a real DB, you'd delete them.
    // mockWaitlist = mockWaitlist.filter(entry => !notifiedIds.has(entry.id));
};
