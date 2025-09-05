
import { mockWaitlist } from '../data/mockData';
import { WaitlistEntry, NewWaitlistEntryData } from '../../../../types';

export const createWaitlistEntry = async (data: NewWaitlistEntryData): Promise<WaitlistEntry> => {
    const newEntry: WaitlistEntry = {
        id: `wait_${crypto.randomUUID()}`,
        ...data,
        createdAt: new Date().toISOString(),
    };
    mockWaitlist.push(newEntry);
    console.log('[waitlistService] New waitlist entry added:', newEntry);
    return newEntry;
};
