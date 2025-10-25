import React, { useState } from 'react';

// Define the props the component will accept (we'll add onSubmit later)
interface UrlInputProps {
  // TODO: Add a function prop to handle form submission
  // onSubmit: (url: string) => void;
}

const UrlInput: React.FC<UrlInputProps> = () => {
  // State to hold the value of the input field
  const [url, setUrl] = useState('');

  // Function to handle form submission (for now, just logs the URL)
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault(); // Prevent default page reload on form submit
    console.log("Submitted URL:", url);
    // TODO: Call the onSubmit prop function here
  };

  return (
    // Form container with the "frosted glass" effect
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-lg p-6 bg-white/10 backdrop-blur-md rounded-lg shadow-lg"
      // bg-white/10: Semi-transparent white background
      // backdrop-blur-md: Applies the blur effect to elements behind it
      // rounded-lg shadow-lg: Adds rounded corners and a shadow for depth
    >
      <label htmlFor="url-input" className="block text-sm font-medium text-gray-300 mb-2">
        Enter Restaurant Menu URL
      </label>
      <div className="flex items-center space-x-2"> {/* Align input and button horizontally */}
        <input
          type="url" // Use type="url" for basic browser validation
          id="url-input"
          value={url}
          onChange={(e) => setUrl(e.target.value)} // Update state when input changes
          placeholder="https://www.example-restaurant.cz/menu"
          required // Make the input required
          className="flex-grow p-2 rounded border border-gray-600 bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          // flex-grow: Input takes available space
          // Styling for dark mode input
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          // Styling for the submit button
        >
          {/* Simple Arrow Icon (or use text like "Go") */}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </div>
    </form>
  );
};

export default UrlInput;