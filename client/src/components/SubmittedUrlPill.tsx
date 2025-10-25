import React from 'react';

interface SubmittedUrlPillProps {
    url: string; // The URL that was submitted
    onClear: () => void; // Function to call when the 'X' is clicked
    isLoading: boolean; // Is the app currently loading (to disable button)
}

const SubmittedUrlPill: React.FC<SubmittedUrlPillProps> = ({ url, onClear, isLoading }) => {
    return (
        // Container for the pill - background, padding, rounded corners, shadow
        <div className="flex items-center justify-between w-full max-w-lg p-3 bg-gray-800 rounded-lg shadow-md">
            {/* Display the submitted URL, truncate if too long */}
            <span className="text-sm text-gray-300 truncate mr-3">
                {url}
            </span>
            {/* Clear button ('X') */}
            <button
                onClick={onClear}
                disabled={isLoading} // Disable while loading
                className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-dxh-primary disabled:opacity-50"
                aria-label="Enter new URL" // Accessibility label
            >
                {/* Simple 'X' icon */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};

export default SubmittedUrlPill;