import React, { useState } from 'react';
import axios from 'axios';
import UrlInput from './components/UrlInput';
import SubmittedUrlPill from './components/SubmittedUrlPill'; // Make sure this import exists
import { MenuResponse } from './types/menu';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuData, setMenuData] = useState<MenuResponse | null>(null);
  const [submittedUrl, setSubmittedUrl] = useState<string | null>(null);

  const handleSummarize = async (url: string) => {
    setIsLoading(true);
    setError(null);
    setMenuData(null);
    setSubmittedUrl(url);

    try {
      const response = await axios.post<MenuResponse>(
        'http://localhost:3001/menu/summarize',
        { url: url }
      );
      setMenuData(response.data);
    } catch (err: any) {
      console.error("API Error:", err);
      setError(err.response?.data?.message || err.message || 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearUrl = () => {
    setSubmittedUrl(null);
    setMenuData(null);
    setError(null);
  };

  return (
    // Adjust flexbox alignment based on submittedUrl state
    <div className={`min-h-screen flex flex-col items-center p-4 ${submittedUrl === null ? 'justify-center' : 'justify-start' // Center ONLY initially
      }`}>

      {/* --- Header Area --- */}
      {/* Add relative positioning for stacking context */}
      <div className="w-full max-w-4xl flex flex-col items-center mb-6 relative">
        {/* Only show the title when the input form is centered and visible */}
        {submittedUrl === null && (
          <h1 className="text-4xl font-bold text-dxh-primary mb-6 transition-opacity duration-300 ease-in-out">
            Restaurant Menu Summarizer
          </h1>
        )}

        {/* Input Form - Always rendered, but opacity changes */}
        {/* Use z-index if needed, though opacity + pointer-events should suffice */}
        <div className={`w-full max-w-lg transition-opacity duration-300 ease-in-out ${submittedUrl === null ? 'opacity-100' : 'opacity-0 pointer-events-none' // Show/Hide based on state
          }`}>
          {/* Ensure isCentered prop is passed */}
          <UrlInput onSubmit={handleSummarize} isLoading={isLoading} isCentered={true} />
        </div>

        {/* Pill - Always rendered (underneath initially), opacity changes */}
        {/* Use fixed positioning */}
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-10 w-full max-w-lg transition-opacity duration-300 ease-in-out ${submittedUrl !== null ? 'opacity-100' : 'opacity-0 pointer-events-none' // Show/Hide based on state
          }`}>
          {/* Render pill only if URL exists to avoid rendering with empty string initially */}
          {submittedUrl && <SubmittedUrlPill url={submittedUrl} onClear={handleClearUrl} isLoading={isLoading} />}
        </div>
      </div>

      {/* --- Content Area (Errors or Results) --- */}
      {/* Use transitions for content fade-in, ensure enough margin-top */}
      <div className={`w-full max-w-2xl transition-opacity duration-500 ease-in-out ${submittedUrl !== null ? 'mt-32 opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {/* Show loading indicator */}
        {isLoading && (
          <div className="flex justify-center items-center p-10">
            <svg className="animate-spin h-10 w-10 text-dxh-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}

        {/* Show error if exists (and not loading) */}
        {error && !isLoading && (
          <div className="p-4 bg-red-900 border border-red-700 text-red-200 rounded">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {/* Show menu data if exists (and not loading) */}
        {menuData && !isLoading && (
          <div className="p-6 bg-gray-800 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-center">{menuData.restaurant_name}</h2>
            <p className="text-center text-gray-400 mb-6">Menu for {menuData.date}</p>

            {menuData.daily_menu && menuData.menu_items.length > 0 ? (
              <ul className="space-y-4">
                {menuData.menu_items.map((item, index) => (
                  <li key={index} className="p-3 bg-gray-700 rounded shadow">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-lg font-semibold text-dxh-primary">{item.price},-</span>
                    </div>
                    <div className="text-sm text-gray-400 flex justify-between">
                      <span>{item.category} {item.weight ? `(${item.weight})` : ''}</span>
                      {item.allergens && item.allergens.length > 0 && (
                        <span>Allergens: {item.allergens.join(', ')}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-gray-400">No daily menu found for today.</p>
            )}
            <p className="text-xs text-gray-500 mt-4 text-center">
              Source: <a href={menuData.source_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-dxh-primary">{menuData.source_url}</a>
            </p>
          </div>
        )}
      </div> {/* End of Content Area */}

    </div> // End of Main container
  );
}

export default App;