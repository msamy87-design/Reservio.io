



import React, { useState, useEffect, useCallback } from 'react';
import { fetchBusinessSettings, updateBusinessSettings } from '../services/api';
// FIX: Import DayOfWeek to fix typing issues with mapping over days.
import { BusinessSettings, DaySchedule, Currency, BusinessHours, DayOfWeek } from '../types';
import { useToast } from '../contexts/ToastContext';
import { ArrowUpTrayIcon } from '../components/Icons';

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
};

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
  const [heroImagePreview, setHeroImagePreview] = useState<string | null>(null);
  const { addToast } = useToast();
  
  // FIX: Use the specific DayOfWeek type to ensure type safety in loops.
  const daysOfWeek: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const currencies: Currency[] = ['USD', 'EUR', 'GBP'];

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedSettings = await fetchBusinessSettings();
      setSettings(fetchedSettings);
      setHeroImagePreview(fetchedSettings.marketplace_listing.public_image_url);
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!settings) return;
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev!, profile: { ...prev!.profile, [name]: value } }));
  };
  
  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!settings) return;
    setSettings(prev => ({ ...prev!, currency: e.target.value as Currency }));
  };

  const handleScheduleChange = (day: keyof BusinessHours, field: keyof DaySchedule, value: any) => {
    if (!settings) return;
    setSettings(prev => ({
        ...prev!,
        hours: {
            ...prev!.hours,
            [day]: {
                ...prev!.hours[day],
                [field]: value,
            }
        }
    }));
  };
  
  const handleMarketplaceListingChange = (field: string, value: any) => {
    if (!settings) return;
    setSettings(prev => ({
      ...prev!,
      marketplace_listing: {
        ...prev!.marketplace_listing,
        [field]: value
      }
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setHeroImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setHeroImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    
    setIsSaving(true);
    try {
        let updatedSettings = { ...settings };
        if (heroImageFile) {
            const base64Image = await fileToBase64(heroImageFile);
            updatedSettings.marketplace_listing.public_image_url = base64Image;
        }
        await updateBusinessSettings(updatedSettings);
        addToast('Settings saved successfully.', 'success');
    } catch (error) {
        console.error("Failed to save settings:", error);
        addToast('Failed to save settings.', 'error');
    } finally {
        setIsSaving(false);
        setHeroImageFile(null); // Reset file state after save
    }
  };
  
  if (isLoading) {
    return (
        <div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Settings</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading settings...</p>
        </div>
    );
  }

  if (!settings) {
    return <div>Error loading settings. Please try again.</div>;
  }

  return (
    <form onSubmit={handleSaveChanges}>
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Settings</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Manage your business profile, operating hours, and currency.</p>
        </div>
        <button 
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 w-32 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 dark:disabled:bg-indigo-800 transition-all duration-200"
        >
            {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="space-y-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Business Profile</h3>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Business Name</label>
                    <input type="text" id="name" name="name" value={settings.profile.name} onChange={handleProfileChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contact Email</label>
                    <input type="email" id="email" name="email" value={settings.profile.email} onChange={handleProfileChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
                    <input type="tel" id="phone" name="phone" value={settings.profile.phone} onChange={handleProfileChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                 <div>
                    <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Currency</label>
                    <select id="currency" name="currency" value={settings.currency} onChange={handleCurrencyChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                    <textarea id="address" name="address" value={settings.profile.address} onChange={handleProfileChange} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
            </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Marketplace Listing</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Control how your business appears on the Reservio marketplace.</p>
            <div className="mt-6 space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div>
                        <p className="font-medium text-gray-800 dark:text-gray-100">Show my business on the marketplace</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Allow customers to find and book your services online.</p>
                    </div>
                    <label htmlFor="is_listed" className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            id="is_listed"
                            checked={settings.marketplace_listing.is_listed}
                            onChange={(e) => handleMarketplaceListingChange('is_listed', e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                    </label>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Public Hero Image</label>
                    <div className="mt-2 flex items-center gap-4">
                        <div className="w-48 h-32 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden flex items-center justify-center">
                            {heroImagePreview ? (
                                <img src={heroImagePreview} alt="Profile preview" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-xs text-gray-500 dark:text-gray-400">No image</span>
                            )}
                        </div>
                        <label htmlFor="image-upload" className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 font-semibold rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer">
                            <ArrowUpTrayIcon className="h-5 w-5" />
                            <span>Upload Image</span>
                            <input id="image-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
                        </label>
                    </div>
                </div>
            </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Operating Hours</h3>
            <div className="mt-4 space-y-4">
                {daysOfWeek.map(day => (
                    <div key={day} className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex items-center md:col-span-1">
                            <input
                                type="checkbox"
                                id={`${day}-open`}
                                checked={settings.hours[day].is_working}
                                onChange={(e) => handleScheduleChange(day, 'is_working', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label htmlFor={`${day}-open`} className="ml-3 block text-sm font-medium text-gray-900 dark:text-gray-200 capitalize">
                                {day}
                            </label>
                        </div>
                        <div className="flex items-center gap-2 md:col-span-2">
                            <input
                                type="time"
                                id={`${day}-start`}
                                value={settings.hours[day].start_time}
                                onChange={(e) => handleScheduleChange(day, 'start_time', e.target.value)}
                                disabled={!settings.hours[day].is_working}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-200 dark:disabled:bg-gray-600"
                            />
                            <span className="text-gray-500 dark:text-gray-400">-</span>
                            <input
                                type="time"
                                id={`${day}-end`}
                                value={settings.hours[day].end_time}
                                onChange={(e) => handleScheduleChange(day, 'end_time', e.target.value)}
                                disabled={!settings.hours[day].is_working}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-200 dark:disabled:bg-gray-600"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </form>
  );
};

export default SettingsPage;
