import React from 'react';

function App() {
  return (
    // Main container for the whole application
    // min-h-screen: takes at least full screen height
    // flex flex-col: enables flexbox layout in a column
    // items-center: centers items horizontally
    // p-4: adds padding around
    <div className="min-h-screen flex flex-col items-center p-4">

      {/* Application Title */}
      <h1 className="text-4xl font-bold text-blue-400 mt-8 mb-6"> {/* Larger text, lighter blue for dark mode, margins */}
        Restaurant Menu Summarizer
      </h1>

      {/* Placeholder for the URL Input - we'll add this next */}
      <div className="w-full max-w-lg mt-10"> {/* Container for the input, limited width, top margin */}
        {/* Input component will go here */}
        <p className="text-center text-gray-400">URL Input will be here...</p>
      </div>

      {/* Placeholder for Menu Results - shown later */}
      <div className="w-full max-w-2xl mt-10"> {/* Container for results, wider, top margin */}
        {/* Results component will go here */}
        {/* <p className="text-center text-gray-400">Menu results will appear here...</p> */}
      </div>

    </div>
  );
}

export default App;