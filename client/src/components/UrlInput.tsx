// client/src/components/UrlInput.tsx
import React, { useState } from 'react';

interface UrlInputProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
  isCentered: boolean;
}

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
      // Apply similar frosted glass, border, and rounding as the results/pill
      className={`w-full max-w-lg p-8 bg-zinc-800/80 backdrop-blur-lg border border-zinc-700 rounded-xl shadow-xl transition-all duration-300 ${ // Updated classes
        isCentered ? 'scale-100' : 'scale-95'
        }`}
    >
      <label htmlFor="url-input" className="block text-lg font-medium text-gray-200 mb-4 text-center">
        Enter Restaurant Menu URL
      </label>
      <div className="flex items-center space-x-3">
        {/* Input field styling can remain similar */}
        <input
          type="url"
          id="url-input"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.example-restaurant.cz/menu"
          required
          disabled={isLoading}
          // Slightly lighter border to match container, adjusted focus ring offset
          className="flex-grow p-3 rounded-md border border-zinc-600 bg-zinc-700 text-gray-100 text-base focus:outline-none focus:ring-2 focus:ring-dxh-primary focus:border-transparent disabled:opacity-50"
        />
        {/* Button styling can remain similar, adjusted focus ring offset */}
        <button
          type="submit"
          disabled={isLoading}
          // Adjusted focus ring offset to match the new background
          className="p-3 bg-zinc-700 text-gray-200 rounded-md hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-dxh-primary focus:ring-offset-2 focus:ring-offset-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed" // Changed offset color
        >
          {isLoading ? (
            <svg className="animate-spin h-6 w-6 text-dxh-primary" /* ... spinner SVG ... */ >
              {/* Spinner paths */}
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