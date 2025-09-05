
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { Booking, AIGrowthInsight, Transaction } from "../../../../types";
import { mockWaitlist, mockBookings, mockServices, mockTransactions } from "../data/mockData";
import { sendWaitlistNotification } from "./notificationService";
import * as dateFns from 'date-fns';

if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. AI services will be disabled.");
}

const ai = process.env.API_KEY ? new GoogleGenerativeAI(process.env.API_KEY) : null;

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
        const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
        const response = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        riskScore: { type: SchemaType.INTEGER }
                    },
                    required: ["riskScore"],
                },
            },
        });
        
        const jsonText = response.response.text().trim();
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

/**
 * Analyzes business data to provide revenue growth insights.
 */
export const getAIGrowthInsights = async (businessId: string): Promise<AIGrowthInsight[]> => {
    if (!ai) {
        console.log("AI service disabled. Returning empty insights.");
        return [];
    }

    // In a real app, you'd fetch data for the specific businessId
    const relevantBookings = mockBookings;
    const relevantServices = mockServices;
    const relevantTransactions = mockTransactions;

    const prompt = `
        You are a business growth consultant for a salon/barbershop.
        Analyze the following business data and identify the top 2-3 most impactful opportunities for revenue growth.
        Focus on identifying potential pricing adjustments and service bundling opportunities.

        Data:
        - Services Offered: ${JSON.stringify(relevantServices.map(s => ({ id: s.id, name: s.name, price: s.price })))}
        - Recent Bookings: ${JSON.stringify(relevantBookings.map(b => ({ serviceId: b.service.id, date: b.start_at })))}
        - Recent Transactions: ${JSON.stringify(relevantTransactions.map(t => ({ items: t.items.map(i => ({ id: i.id, name: i.name, type: i.type })) })))}

        For each opportunity, provide a unique ID, a type ('pricing' or 'bundling'), a short, catchy title, and a one-sentence description explaining the opportunity.
        Your response must be a valid JSON array.
    `;
    
    try {
        const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
        const response = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.ARRAY,
                    items: {
                        type: SchemaType.OBJECT,
                        properties: {
                            id: { type: SchemaType.STRING },
                            type: { type: SchemaType.STRING },
                            title: { type: SchemaType.STRING },
                            description: { type: SchemaType.STRING }
                        },
                        required: ["id", "type", "title", "description"]
                    }
                },
            },
        });
        
        const jsonText = response.response.text().trim();
        const insights: AIGrowthInsight[] = JSON.parse(jsonText);
        console.log('[aiService] Gemini Growth Insights:', insights);
        return insights;
    } catch (error) {
        console.error("Error calling Gemini API for growth insights:", error);
        // Fallback to mock data on error
        return [
            { id: 'mock_1', type: 'pricing', title: 'Weekend Price Adjustment', description: "Our data shows 'Deluxe Shave' is fully booked every Friday. Consider increasing its price by $5 on weekends." },
            { id: 'mock_2', type: 'bundling', title: 'Create a Grooming Package', description: "Customers who book 'Haircut' often also get a 'Beard Trim'. Offer them as a discounted bundle." }
        ];
    }
};
