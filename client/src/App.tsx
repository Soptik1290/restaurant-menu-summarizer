import React, { useState } from 'react';
import axios from 'axios';
import UrlInput from './components/UrlInput';
import SubmittedUrlPill from './components/SubmittedUrlPill';
import { MenuResponse } from './types/menu';

/**
 * Hlavní komponenta aplikace pro sumarizaci jídelních lístků
 * Spravuje stav načítání, chyb a zobrazení výsledků
 */
function App() {
  // Stav pro indikaci načítání
  const [isLoading, setIsLoading] = useState(false);
  // Stav pro zobrazení chybových zpráv
  const [error, setError] = useState<string | null>(null);
  // Stav pro uložení extrahovaných dat menu
  const [menuData, setMenuData] = useState<MenuResponse | null>(null);
  // Stav pro uložení odeslané URL
  const [submittedUrl, setSubmittedUrl] = useState<string | null>(null);

  /**
   * Handler pro zpracování požadavku na sumarizaci menu
   * @param url URL restaurace pro extrakci menu
   */
  const handleSummarize = async (url: string) => {
    setIsLoading(true);
    setError(null);
    setMenuData(null);
    setSubmittedUrl(url);

    try {
      // Volání API pro extrakci a sumarizaci menu
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

  /**
   * Handler pro vymazání odeslané URL a resetování stavu
   */
  const handleClearUrl = () => {
    setSubmittedUrl(null);
    setMenuData(null);
    setError(null);
  };

  return (
    // Hlavní kontejner s dynamickým zarovnáním podle stavu
    <div className={`min-h-screen flex flex-col items-center p-4 ${submittedUrl === null ? 'justify-center' : 'justify-start'}`}>

      {/* --- Hlavička aplikace --- */}
      <div className="w-full max-w-4xl flex flex-col items-center mb-6 relative">
        {/* Zobrazení titulku pouze když je formulář vycentrovaný */}
        {submittedUrl === null && (
          <h1 className="text-4xl font-bold text-dxh-primary mb-6 transition-opacity duration-300 ease-in-out">
            Restaurant Menu Summarizer
          </h1>
        )}

        {/* Formulář pro zadání URL - vždy vykreslen, mění se pouze opacity */}
        <div className={`w-full max-w-lg transition-opacity duration-300 ease-in-out ${submittedUrl === null ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <UrlInput onSubmit={handleSummarize} isLoading={isLoading} isCentered={true} />
        </div>

        {/* Pill s odeslanou URL - vždy vykreslen, mění se pouze opacity */}
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-10 w-full max-w-lg transition-opacity duration-300 ease-in-out ${submittedUrl !== null ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          {submittedUrl && <SubmittedUrlPill url={submittedUrl} onClear={handleClearUrl} isLoading={isLoading} />}
        </div>
      </div>

      {/* --- Oblast obsahu (chyby nebo výsledky) --- */}
      <div className={`w-full max-w-2xl transition-opacity duration-500 ease-in-out ${submittedUrl !== null ? 'mt-32 opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {/* Indikátor načítání */}
        {isLoading && (
          <div className="flex justify-center items-center p-10">
            <svg className="animate-spin h-10 w-10 text-dxh-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}

        {/* Zobrazení chyby (pokud existuje a neprobíhá načítání) */}
        {error && !isLoading && (
          <div className="p-4 bg-red-900 border border-red-700 text-red-200 rounded">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {/* Zobrazení dat menu (pokud existují a neprobíhá načítání) */}
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
      </div>

    </div>
  );
}

export default App;