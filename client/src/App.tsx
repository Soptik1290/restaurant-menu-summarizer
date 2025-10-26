import React, { useState } from 'react';
import axios from 'axios';
import UrlInput from './components/UrlInput';
import SubmittedUrlPill from './components/SubmittedUrlPill';
import JsonDisplay from './components/JsonDisplay'; // Import JsonDisplay
import { MenuResponse } from './types/menu';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuData, setMenuData] = useState<MenuResponse | null>(null);
  const [submittedUrl, setSubmittedUrl] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false); // Stav pro zobrazení JSONu

  const handleSummarize = async (url: string) => {
    setIsLoading(true);
    setError(null);
    setMenuData(null);
    setShowJson(false); // Skryj JSON při novém hledání
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
    setShowJson(false); // Skryj JSON při vymazání
  };

  // Funkce pro přepnutí zobrazení JSONu
  const toggleShowJson = () => {
    setShowJson(prevShowJson => !prevShowJson);
  };

  return (
    <div className={`min-h-screen flex flex-col items-center p-4 ${submittedUrl === null ? 'justify-center' : 'justify-start'
      }`}>

      {/* --- Oblast Hlavičky --- */}
      <div className="w-full max-w-4xl flex flex-col items-center mb-6 relative">
        {/* Zobraz nadpis pouze pokud není odeslaná URL */}
        {submittedUrl === null && (
          <h1 className="text-4xl font-bold text-dxh-primary mb-6 transition-opacity duration-300 ease-in-out">
            Restaurant Menu Summarizer
          </h1>
        )}

        {/* Input Form - Vždy renderovaný, mění se opacity */}
        <div className={`w-full max-w-lg transition-opacity duration-300 ease-in-out ${submittedUrl === null ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}>
          <UrlInput onSubmit={handleSummarize} isLoading={isLoading} isCentered={true} />
        </div>

        {/* Pill - Vždy renderovaný (zpočátku pod), mění se opacity */}
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-10 w-full max-w-lg transition-opacity duration-300 ease-in-out ${submittedUrl !== null ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}>
          {submittedUrl && <SubmittedUrlPill url={submittedUrl} onClear={handleClearUrl} isLoading={isLoading} />}
        </div>
      </div>

      {/* --- Oblast Obsahu (Chyby nebo Výsledky) --- */}
      <div className={`w-full max-w-6xl transition-opacity duration-500 ease-in-out ${submittedUrl !== null ? 'mt-32 opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {isLoading && (
          <div className="flex justify-center items-center p-10">
            <svg className="animate-spin h-10 w-10 text-dxh-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}

        {error && !isLoading && (
          <div className="p-4 bg-red-900 border border-red-700 text-red-200 rounded w-full max-w-lg mx-auto"> {/* Centrování chyby */}
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {/* --- Wrapper pro Výsledky (Menu + JSON) --- */}
        {menuData && !isLoading && (
          // Použij flex pro zobrazení vedle sebe na větších obrazovkách
          <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0 items-start justify-center"> {/* Přidáno justify-center */}

            {/* --- Zobrazení Menu --- */}
            {/* Omezíme šířku menu, pokud je zobrazen JSON */}
            {/* Přidáme transition pro plynulou změnu šířky */}
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
              ) : (
                <p className="text-center text-gray-400">No daily menu found for today.</p>
              )}
              <p className="text-xs text-gray-500 mt-6 text-center">
                Source: <a href={menuData.source_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-dxh-primary">{menuData.source_url}</a>
              </p>
              {/* Tlačítko pro přepnutí JSONu */}
              <div className="text-center mt-6">
                <button
                  onClick={toggleShowJson}
                  className="px-4 py-2 text-sm bg-zinc-700 text-gray-300 rounded hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-dxh-primary focus:ring-offset-2 focus:ring-offset-zinc-900"
                >
                  {showJson ? 'Hide JSON' : 'Show JSON'}
                </button>
              </div>
            </div>

            {/* --- Zobrazení JSONu (Podmíněné & Animované) --- */}
            {/* Přidáme transition pro plynulé zobrazení */}
            {/* Přidáme `overflow-hidden` na rodiče, aby animace byla čistší */}
            <div className={`transition-all duration-500 ease-in-out w-full md:w-1/2 ${showJson ? 'opacity-100 translate-x-0 max-h-[1000px]' : 'opacity-0 -translate-x-4 max-h-0 md:hidden'}`}>
              <JsonDisplay data={menuData} />
            </div>
          </div>
        )}
      </div> {/* Konec Oblasti Obsahu */}
    </div> // Konec hlavního kontejneru
  );
}

export default App;