import React, { useState } from 'react';
import axios, { AxiosError } from 'axios';
import UrlInput from './components/UrlInput';
import SubmittedUrlPill from './components/SubmittedUrlPill';
import JsonDisplay from './components/JsonDisplay';
import BackgroundEmojis from './components/BackgroundEmojis';
import { MenuResponse } from './types/menu'; 

// Define a type for structured errors from backend
interface ApiError {
  statusCode: number;
  message: string;
  error?: string; // e.g., "Not Found", "Bad Gateway"
}

function App() {
  const [isLoading, setIsLoading] = useState(false);
  // Store error message or structured error
  const [error, setError] = useState<string | ApiError | null>(null);
  const [menuData, setMenuData] = useState<MenuResponse | null>(null);
  const [submittedUrl, setSubmittedUrl] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);

  const handleSummarize = async (url: string) => {
    setIsLoading(true);
    setError(null);
    setMenuData(null);
    setShowJson(false); // Hide JSON on new search
    setSubmittedUrl(url); // Update the displayed URL

    // Determine API URL: prefer env, otherwise fall back for local/Cypress runs
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    console.log(`Using API URL: ${apiUrl}`);

    // Ensure apiUrl is defined before making the call
    if (!apiUrl) {
      console.error("CRITICAL: REACT_APP_API_URL is not defined! Check client/.env locally or Dockerfile build args.");
      setError({ statusCode: 500, message: "API URL configuration is missing in the frontend application."});
      setIsLoading(false);
      return; // Stop execution if URL is missing
    }

    try {
      const response = await axios.post<MenuResponse>(
        `${apiUrl}/menu/summarize`, // This will now resolve to '/api/menu/summarize'
        { url: url }
      );
      setMenuData(response.data);
    } catch (err: any) {
      console.error("API Error:", err);
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<ApiError>;
        // Log detailed Axios error
        console.error("Axios Error Response:", axiosError.response?.data);
        console.error("Axios Error Status:", axiosError.response?.status);
        // Prefer backend error structure; fallback to message/status
        setError(axiosError.response?.data || { statusCode: axiosError.response?.status || 500, message: axiosError.message });
      } else {
        // Log non-Axios error
        console.error("Non-Axios Error:", err);
        setError({ statusCode: 500, message: err.message || 'An unknown error occurred' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh the CURRENTLY submitted URL
  const handleRefresh = () => {
    if (submittedUrl && !isLoading) {
      // Reuse handleSummarize with the same URL
      handleSummarize(submittedUrl);
    }
  };

  const toggleShowJson = () => {
    setShowJson(prevShowJson => !prevShowJson);
  };

  // Helper function to render errors more informatively
  const renderError = () => {
    if (!error) return null;

    let title = 'An Error Occurred';
    let message = 'Something went wrong.';
    let statusCode: number | undefined;

    if (typeof error === 'string') {
      // Basic network errors (like ERR_CONNECTION_REFUSED) might just be strings
      message = error;
       if (message.toLowerCase().includes('network error') || message.toLowerCase().includes('connection refused')) {
        title = 'Network Error';
        message = 'Could not connect to the backend server. Please ensure it is running and accessible.';
      } else {
        title = 'Error';
      }
    } else {
      // Handle structured ApiError from backend or AxiosError structure
      statusCode = error.statusCode;
      title = `Error ${statusCode || ''}`;
      if (error.error) {
        title += `: ${error.error}`;
      }
      message = error.message;

      // Customize messages based on status codes for better UX
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
    // Main container
    <div className={`min-h-screen flex flex-col items-center p-4 pb-16 relative ${
        submittedUrl === null ? 'justify-center' : ''
    }`}>
      <BackgroundEmojis />

      {/* --- Header Area --- */}
      <div className="w-full max-w-4xl flex flex-col items-center relative z-0">
        {submittedUrl === null && (
          <h1 className="text-4xl font-bold text-dxh-primary mb-6 transition-opacity duration-300 ease-in-out">
            Restaurant Menu Summarizer
          </h1>
        )}

        {/* Input Form */}
        <div className={`w-full max-w-lg transition-opacity duration-300 ease-in-out ${
            submittedUrl === null ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          <UrlInput onSubmit={handleSummarize} isLoading={isLoading} isCentered={true} />
        </div>
      </div>

      {/* --- Content Area --- */}
      <div className={`w-full max-w-6xl mx-auto transition-opacity duration-500 ease-in-out relative z-0 ${submittedUrl !== null ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {isLoading && (
           <div className="flex justify-center items-center p-10">
               <svg className="animate-spin h-10 w-10 text-dxh-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
           </div>
        )}

        {!isLoading && error && renderError()}

        {/* --- Results Wrapper --- */}
        {menuData && !isLoading && (
          // Add mt-16 here to create space below the fixed pill
          <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0 items-start justify-center mt-16">

            {/* --- Menu Display --- */}
            <div className={`p-6 bg-zinc-800/80 backdrop-blur-lg border border-zinc-700 rounded-xl shadow-xl w-full transition-all duration-500 ease-in-out ${showJson ? 'md:w-1/2' : 'md:w-2/3 lg:w-1/2'}`}>
              <h2 className="text-3xl font-bold mb-3 text-center text-dxh-primary">{menuData.restaurant_name}</h2>
              <p className="text-center text-gray-400 mb-8">Menu for {menuData.date}</p>

              {menuData.daily_menu && menuData.menu_items.length > 0 ? (
                <ul className="space-y-3">
                   {menuData.menu_items.map((item, index) => (
                     <li
                       key={index}
                       className="p-3 bg-zinc-700/50 border border-zinc-600 rounded-lg shadow-sm
                                  transition-all duration-200 ease-in-out
                                  hover:bg-zinc-700/80 hover:scale-[1.02] hover:shadow-md"
                     >
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
               {/* Show/Hide JSON Button */}
               <div className="text-center mt-6">
                <button
                  onClick={toggleShowJson}
                  className="px-4 py-2 text-sm bg-zinc-700 text-gray-300 rounded hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-dxh-primary focus:ring-offset-2 focus:ring-offset-zinc-900"
                >
                  {showJson ? 'Hide JSON' : 'Show JSON'}
                </button>
              </div>
            </div>

            {/* --- JSON Display Wrapper --- */}
            <div className={`transition-all duration-500 ease-in-out overflow-hidden
                           bg-zinc-900 border border-zinc-700 rounded-lg shadow-inner
                           ${showJson ? 'max-w-full md:max-w-[50%] opacity-100 p-4' : 'max-w-0 opacity-0 p-0 border-0'}`}>
              {showJson && <JsonDisplay data={menuData} />}
            </div>
          </div>
        )}
      </div> {/* End Content Area */}

      {/* --- Fixed Pill --- */}
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg transition-opacity duration-300 ease-in-out ${
          submittedUrl !== null ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        {submittedUrl && (
          <SubmittedUrlPill
            url={submittedUrl}
            onRefresh={handleRefresh}
            onSubmitNew={handleSummarize}
            isLoading={isLoading}
          />
        )}
      </div>

    </div> // End Main container
  );
}

export default App;