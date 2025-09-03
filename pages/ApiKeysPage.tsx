
import React, { useState, useEffect, useCallback } from 'react';
import { fetchApiKeys, generateApiKey, revokeApiKey } from '../services/api';
import { ApiKey, NewApiKeyResult } from '../types';
import Modal from '../components/Modal';
import { KeyIcon, CopyIcon, CheckIcon } from '../components/Icons';
import { useToast } from '../contexts/ToastContext';

const ApiKeyRow: React.FC<{ apiKey: ApiKey; onRevoke: (id: string) => void }> = ({ apiKey, onRevoke }) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <tr className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
      <td className="px-6 py-4">
        <div className="font-medium text-gray-900 dark:text-white">{apiKey.name}</div>
      </td>
      <td className="px-6 py-4">
        <span className="font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded text-xs">{apiKey.key_prefix}...</span>
      </td>
      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{formatDate(apiKey.created_at)}</td>
      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{formatDate(apiKey.last_used_at)}</td>
      <td className="px-6 py-4">
        <button
          onClick={() => onRevoke(apiKey.id)}
          className="font-medium text-red-600 dark:text-red-500 hover:underline"
        >
          Revoke
        </button>
      </td>
    </tr>
  );
};

const ApiKeysPage: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newApiKeyResult, setNewApiKeyResult] = useState<NewApiKeyResult | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const { addToast } = useToast();

  const loadApiKeys = useCallback(async () => {
    setIsLoading(true);
    const keys = await fetchApiKeys();
    setApiKeys(keys);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadApiKeys();
  }, [loadApiKeys]);

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    setIsGenerating(true);
    try {
        const result = await generateApiKey(newKeyName);
        setNewApiKeyResult(result);
        setIsModalOpen(true);
        setNewKeyName('');
        loadApiKeys(); // Refresh the list
    } catch (error) {
        addToast('Failed to generate API key.', 'error');
    } finally {
        setIsGenerating(false);
    }
  };
  
  const handleRevokeKey = async (keyId: string) => {
    if (window.confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
        try {
            await revokeApiKey(keyId);
            setApiKeys(currentKeys => currentKeys.filter(key => key.id !== keyId));
            addToast('API Key revoked successfully.', 'success');
        } catch (error) {
            addToast('Failed to revoke API key.', 'error');
        }
    }
  };

  const handleCopyToClipboard = () => {
    if (!newApiKeyResult) return;
    navigator.clipboard.writeText(newApiKeyResult.api_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewApiKeyResult(null);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">API Keys</h2>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Manage API keys for integrations and external services.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Generate New API Key</h3>
        <form onSubmit={handleGenerateKey} className="mt-4 flex items-end gap-4">
          <div className="flex-grow">
            <label htmlFor="keyName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Key Name
            </label>
            <input
              type="text"
              id="keyName"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="e.g., My Awesome App"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isGenerating || !newKeyName.trim()}
            className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed dark:disabled:bg-indigo-800"
          >
            {isGenerating ? 'Generating...' : 'Generate Key'}
          </button>
        </form>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="relative overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">Name</th>
                <th scope="col" className="px-6 py-3">Key Prefix</th>
                <th scope="col" className="px-6 py-3">Created</th>
                <th scope="col" className="px-6 py-3">Last Used</th>
                <th scope="col" className="px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-10">Loading keys...</td>
                </tr>
              ) : apiKeys.length === 0 ? (
                 <tr>
                  <td colSpan={5} className="text-center py-10">No API keys found.</td>
                </tr>
              ) : (
                apiKeys.map(key => <ApiKeyRow key={key.id} apiKey={key} onRevoke={handleRevokeKey} />)
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title="API Key Generated Successfully">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Please copy this key and store it securely. You will not be able to see it again.
          </p>
          <div className="mt-4 relative bg-gray-100 dark:bg-gray-900 rounded-md p-3 font-mono text-sm text-gray-700 dark:text-gray-200">
            <span>{newApiKeyResult?.api_key}</span>
            <button
                onClick={handleCopyToClipboard}
                className="absolute top-1/2 right-2 -translate-y-1/2 p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Copy to clipboard"
            >
              {copied ? (
                 <CheckIcon className="h-5 w-5 text-green-500" />
              ) : (
                <CopyIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              )}
            </button>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={closeModal}
              className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Done
            </button>
          </div>
      </Modal>
    </>
  );
};

export default ApiKeysPage;