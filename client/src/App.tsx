import React, { useState } from 'react';
import axios, { AxiosError } from 'axios';
import UrlInput from './components/UrlInput';
import SubmittedUrlPill from './components/SubmittedUrlPill';
import JsonDisplay from './components/JsonDisplay';
import BackgroundEmojis from './components/BackgroundEmojis';
import { MenuResponse } from './types/menu';

/**
 * Interface for structured API errors from backend
 * Used to provide detailed error information to the user
 */
interface ApiError {
  statusCode: number;
  message: string;
  error?: string; // e.g., "Not Found", "Bad Gateway"
}

/**
 * Main application component for restaurant menu summarization
 * Manages loading state, errors, and menu data display
 */
function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | ApiError | null>(null);
  const [menuData, setMenuData] = useState<MenuResponse | null>(null);
  const [submittedUrl, setSubmittedUrl] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);

  /**
   * Handles menu summarization request
   * @param url Restaurant URL for menu extraction
   */
  const handleSummarize = async (url: string) => {
    setIsLoading(true);
    setError(null);
    setMenuData(null);
    setShowJson(false);
    setSubmittedUrl(url);

    try {
      const response = await axios.post<MenuResponse>(
        'http://localhost:3001/menu/summarize',
        { url: url }
      );
      setMenuData(response.data);
    } catch (err: any) {
      console.error("API Error:", err);
      // Handle axios errors with structured API error response
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<ApiError>;
        setError(axiosError.response?.data || { statusCode: axiosError.response?.status || 500, message: axiosError.message });
      } else {
        setError({ statusCode: 500, message: err.message || 'An unknown error occurred' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Clears the submitted URL and resets all state
   */
  const handleClearUrl = () => {
    setSubmittedUrl(null);
    setMenuData(null);
    setError(null);
    setShowJson(false);
  };

  /**
   * Toggles JSON display for debugging
   */
  const toggleShowJson = () => {
    setShowJson(prevShowJson => !prevShowJson);
  };

  /**
   * Renders error messages with user-friendly descriptions based on error type
   * @returns Error display component or null
   */
  const renderError = () => {
    if (!error) return null;

    let title = 'An Error Occurred';
    let message = 'Something went wrong.';
    let statusCode: number | undefined;

    if (typeof error === 'string') {
      message = error;
      if (message.toLowerCase().includes('network error')) {
        title = 'Network Error';
        message = 'Could not connect to the server. Please check if it is running.';
      } else {
        title = 'Error';
      }
    } else {
      statusCode = error.statusCode;
      title = `Error ${statusCode || ''}`;
      if (error.error) {
        title += `: ${error.error}`;
      }
      message = error.message;

      // Provide user-friendly error messages based on HTTP status code
      switch (statusCode) {
        case 404:
          message = "The restaurant website link seems broken or doesn't exist (404 Not Found). Please check the URL.";
          break;
        case 504:
          message = "The website or processing service took too long to respond (Timeout). It might be down or very slow.";
          break;
        case 415:
          message = "Sorry, I can only process menus from web pages (HTML), images (PNG/JPG), or PDF files.";
          break;
        case 422:
          message = "The text extracted from the file (image/PDF) was empty or unreadable by the AI.";
          break;
        case 502:
          message = "There was a problem reaching the target website or the background processing service (Bad Gateway).";
          break;
        case 500:
          title = "Internal Server Error";
          message = `Something went wrong on the server. Please try again later.`;
          console.error("Internal Server Error Details:", error.message);
          break;
        default:
          message = error.message;
          break;
      }
    }

    return (
      <div className="p-4 bg-red-900 border border-red-700 text-red-200 rounded w-full max-w-lg mx-auto">
        <p className="font-semibold">{title}</p>
        <p>{message}</p>
      </div>
    );
  };


  return (
    <div className={`min-h-screen flex flex-col items-center p-4 pb-16 relative ${submittedUrl === null ? 'justify-center' : ''}`}>
      <BackgroundEmojis />

      <div className="w-full max-w-4xl flex flex-col items-center mb-6 relative z-0">
        {submittedUrl === null && (
          <h1 className="text-4xl font-bold text-dxh-primary mb-6 transition-opacity duration-300 ease-in-out">
            Restaurant Menu Summarizer
          </h1>
        )}

        <div className={`w-full max-w-lg transition-opacity duration-300 ease-in-out ${submittedUrl === null ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <UrlInput onSubmit={handleSummarize} isLoading={isLoading} isCentered={true} />
        </div>
      </div>

      <div className={`w-full max-w-6xl mx-auto transition-opacity duration-500 ease-in-out relative z-0 ${submittedUrl !== null ? 'mt-24 opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {isLoading && (
          <div className="flex justify-center items-center p-10">
            <svg className="animate-spin h-10 w-10 text-dxh-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}

        {!isLoading && error && renderError()}

        {menuData && !isLoading && (
          <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0 items-start justify-center">

            <div className={`p-6 bg-zinc-800/80 backdrop-blur-lg border border-zinc-700 rounded-xl shadow-xl w-full transition-all duration-500 ease-in-out ${showJson ? 'md:w-1/2' : 'md:w-2/3 lg:w-1/2'}`}>
              <h2 className="text-3xl font-bold mb-3 text-center text-dxh-primary">{menuData.restaurant_name}</h2>
              <p className="text-center text-gray-400 mb-8">Menu for {menuData.date}</p>

              {menuData.daily_menu && menuData.menu_items.length > 0 ? (
                <ul className="space-y-3">
                  {menuData.menu_items.map((item, index) => (
                    <li key={index} className="p-3 bg-zinc-700/50 border border-zinc-600 rounded-lg shadow-sm">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-gray-100 mr-4">{item.name}</span>
                        <span className="text-xl font-bold text-dxh-primary whitespace-nowrap">{item.price},-</span>
                      </div>
                      <div className="text-sm text-gray-400 flex justify-between items-center">
                        <span className="capitalize">{item.category}{item.weight ? ` (${item.weight})` : ''}</span>
                        {item.allergens && item.allergens.length > 0 && (
                          <span className="text-xs">Allergens: {item.allergens.join(', ')}</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : menuData.restaurant_name?.includes('(pravděpodobně zavřeno)') ? (
                <p className="text-center text-orange-400 font-semibold">Restaurant appears to be closed today.</p>
              ) : (
                <p className="text-center text-gray-400">No daily menu found for today on the provided page.</p>
              )}

              <p className="text-xs text-gray-500 mt-6 text-center">
                Source: <a href={menuData.source_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-dxh-primary">{menuData.source_url}</a>
              </p>
              <div className="text-center mt-6">
                <button
                  onClick={toggleShowJson}
                  className="px-4 py-2 text-sm bg-zinc-700 text-gray-300 rounded hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-dxh-primary focus:ring-offset-2 focus:ring-offset-zinc-900"
                >
                  {showJson ? 'Hide JSON' : 'Show JSON'}
                </button>
              </div>
            </div>

            <div className={`transition-all duration-500 ease-in-out w-full md:w-1/2 ${showJson ? 'opacity-100 translate-x-0 max-h-[1000px]' : 'opacity-0 -translate-x-4 max-h-0 md:hidden'}`}>
              {showJson && <JsonDisplay data={menuData} />}
            </div>
          </div>
        )}
      </div>

      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg transition-opacity duration-300 ease-in-out ${submittedUrl !== null ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {submittedUrl && <SubmittedUrlPill url={submittedUrl} onClear={handleClearUrl} isLoading={isLoading} />}
      </div>

    </div>
  );
}

export default App;