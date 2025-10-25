import React, { useState } from 'react';
import axios from 'axios';
import UrlInput from './components/UrlInput';
import { MenuResponse } from './types/menu';

function App() {
  // State variables
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuData, setMenuData] = useState<MenuResponse | null>(null);

  // Function to call the backend API
  const handleSummarize = async (url: string) => {
    setIsLoading(true);
    setError(null);
    setMenuData(null);

    try {
      // Make the POST request to our NestJS backend
      const response = await axios.post<MenuResponse>(
        'http://localhost:3001/menu/summarize', // Backend URL
        { url: url } // Request body
      );
      setMenuData(response.data);
    } catch (err: any) {
      console.error("API Error:", err);
      setError(err.response?.data?.message || err.message || 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4">
      <h1 className="text-4xl font-bold text-blue-400 mt-8 mb-6">
        Restaurant Menu Summarizer
      </h1>

      {/* URL Input Form */}
      <div className="w-full max-w-lg mt-10">
        <UrlInput onSubmit={handleSummarize} isLoading={isLoading} />
      </div>

      {/* Conditional Rendering for Error */}
      {error && (
        <div className="mt-6 p-4 bg-red-900 border border-red-700 text-red-200 rounded w-full max-w-lg">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {/* Conditional Rendering for Menu Results */}
      {menuData && (
        <div className="mt-10 p-6 bg-gray-800 rounded-lg shadow-md w-full max-w-2xl">
          <h2 className="text-2xl font-semibold mb-4 text-center">{menuData.restaurant_name}</h2>
          <p className="text-center text-gray-400 mb-6">Menu for {menuData.date}</p>

          {menuData.daily_menu && menuData.menu_items.length > 0 ? (
            <ul className="space-y-4"> {/* Add spacing between items */}
              {menuData.menu_items.map((item, index) => (
                <li key={index} className="p-3 bg-gray-700 rounded shadow">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-lg font-semibold text-blue-400">{item.price},-</span>
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
            Source: <a href={menuData.source_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-400">{menuData.source_url}</a>
          </p>
        </div>
      )}
    </div>
  );
}

export default App;