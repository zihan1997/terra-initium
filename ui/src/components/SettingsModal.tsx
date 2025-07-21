import React, { useState, useEffect } from 'react';
import { Settings, X, Key, Eye, EyeOff } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gptToken: string;
  onTokenChange: (token: string) => void;
}

export function SettingsModal({ isOpen, onClose, gptToken, onTokenChange }: SettingsModalProps) {
  const [token, setToken] = useState(gptToken);
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    setToken(gptToken);
  }, [gptToken]);

  if (!isOpen) return null;

  const handleSave = () => {
    onTokenChange(token);
    onClose();
  };

  const handleClear = () => {
    setToken('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Settings
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Key className="w-4 h-4 inline mr-2" />
              OpenAI GPT Token
            </label>
            <div className="relative">
              <input
                type={showToken ? "text" : "password"}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter your OpenAI API token (sk-...)"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showToken ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              This token will be used to evaluate your interview answers using GPT. 
              It's stored in your browser session and automatically cleared when you close the tab.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">How to get your token:</h3>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. Go to <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">OpenAI API Keys</a></li>
              <li>2. Click "Create new secret key"</li>
              <li>3. Copy the token (starts with "sk-")</li>
              <li>4. Paste it here</li>
            </ol>
          </div>

          {token && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-700">
                ✓ Token configured ({token.slice(0, 7)}...{token.slice(-4)})
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-between gap-4 mt-8">
          <button
            onClick={handleClear}
            className="px-4 py-2 text-red-600 hover:text-red-800 border border-red-300 rounded-lg hover:bg-red-50"
          >
            Clear Token
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}