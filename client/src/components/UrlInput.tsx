// client/src/components/UrlInput.tsx
import React, { useState } from 'react';

interface UrlInputProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
  isCentered: boolean; // Receive the new prop
}

// Updated styles for a look closer to the screenshot and centered state
const UrlInput: React.FC<UrlInputProps> = ({ onSubmit, isLoading, isCentered }) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isLoading && url) {
      onSubmit(url);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      // Darker background, less transparency, slightly larger padding, rounded-xl
      className={`w-full max-w-lg p-8 bg-zinc-800/70 backdrop-blur-lg rounded-xl shadow-xl transition-all duration-300 ${isCentered ? 'scale-100' : 'scale-95' // Example: slightly smaller when not centered (optional effect)
        }`}
    >
      {/* Larger label, centered */}
      <label htmlFor="url-input" className="block text-lg font-medium text-gray-200 mb-4 text-center">
        Enter Restaurant Menu URL
      </label>
      <div className="flex items-center space-x-3"> {/* Slightly more space */}
        {/* Input field with darker background and clearer text */}
        <input
          type="url"
          id="url-input"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.example-restaurant.cz/menu"
          required
          disabled={isLoading}
          // Darker input, larger text, distinct border on focus, rounded-md
          className="flex-grow p-3 rounded-md border border-zinc-600 bg-zinc-700 text-gray-100 text-base focus:outline-none focus:ring-2 focus:ring-dxh-primary focus:border-transparent disabled:opacity-50"
        />
        {/* Button styling - slightly larger, clearer separation, rounded-md */}
        <button
          type="submit"
          disabled={isLoading}
          className="p-3 bg-zinc-700 text-gray-200 rounded-md hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-dxh-primary focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <svg className="animate-spin h-6 w-6 text-dxh-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          )}
        </button>
      </div>
    </form>
  );
};

export default UrlInput;