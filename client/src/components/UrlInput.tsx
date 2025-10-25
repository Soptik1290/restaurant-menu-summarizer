import React, { useState } from 'react';

interface UrlInputProps {
  onSubmit: (url: string) => void; // Function called when form is submitted
  isLoading: boolean; // Is the app currently loading data?
}

const UrlInput: React.FC<UrlInputProps> = ({ onSubmit, isLoading }) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isLoading && url) { // Only submit if not loading and URL is not empty
      onSubmit(url); // Call the parent function with the entered URL
    }
  };

  return (
    // Form container - uses Tailwind v3 classes
    <form
      onSubmit={handleSubmit}
      // Adjust background/blur for v3 if needed, this should still work
      className="w-full max-w-lg p-6 bg-white/10 backdrop-blur-md rounded-lg shadow-lg"
    >
      <label htmlFor="url-input" className="block text-sm font-medium text-gray-300 mb-2">
        Enter Restaurant Menu URL
      </label>
      <div className="flex items-center space-x-2">
        <input
          type="url"
          id="url-input"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.example-restaurant.cz/menu"
          required
          disabled={isLoading} // Disable input while loading
          className="flex-grow p-2 rounded border border-gray-600 bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" // Added disabled style
        />
        <button
          type="submit"
          disabled={isLoading} // Disable button while loading
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed" // Added disabled styles
        >
          {/* Show spinner when loading, otherwise show arrow */}
          {isLoading ? (
            <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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