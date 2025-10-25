import React from 'react';

interface SubmittedUrlPillProps {
    url: string;
    onClear: () => void;
    isLoading: boolean;
}

/**
 * Komponenta pro zobrazení odeslané URL v podobě pilulky
 * Obsahuje tlačítko pro vymazání a zobrazení loading stavu
 */
const SubmittedUrlPill: React.FC<SubmittedUrlPillProps> = ({ url, onClear, isLoading }) => {
    return (
        <div className="flex items-center justify-between w-full max-w-lg p-3 bg-zinc-800/80 backdrop-blur-lg border border-zinc-700 rounded-full shadow-lg">
            {/* Zobrazení URL s oříznutím */}
            <span className="flex-grow text-sm text-gray-300 bg-zinc-700/50 rounded-full px-4 py-1.5 mr-3 truncate">
                {url}
            </span>
            {/* Tlačítko pro vymazání URL */}
            <button
                onClick={onClear}
                disabled={isLoading}
                className="flex items-center justify-center w-8 h-8 bg-zinc-700 text-gray-400 rounded-full
                   hover:bg-zinc-600 hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-dxh-primary focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Enter new URL"
            >
                {isLoading ? (
                    // Spinner během načítání
                    <svg className="animate-spin h-5 w-5 text-dxh-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : (
                    // Ikona pro obnovení/vymazání
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.181c.515.515 1.296.71 2.071.71h1.016a.999.999 0 0 0 .993-.993c0-.348-.146-.668-.396-.913l-3.181-3.181m0-4.991v4.99" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.985 4.644v4.992m0 0h-4.992m4.992 0-3.181-3.181c-.515-.515-1.296-.71-2.071-.71H10.5a.999.999 0 0 0-.993.993c0 .348.146.668.396.913l3.181 3.181m0 4.991v-4.99" />
                    </svg>
                )}
            </button>
        </div>
    );
};

export default SubmittedUrlPill;