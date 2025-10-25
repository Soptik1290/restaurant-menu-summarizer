import React from 'react';
import UrlInput from './components/UrlInput'; // <-- 1. Import the new component

function App() {
  return (
    <div className="min-h-screen flex flex-col items-center p-4">

      <h1 className="text-4xl font-bold text-blue-400 mt-8 mb-6">
        Restaurant Menu Summarizer
      </h1>

      {/* Use the UrlInput component */}
      <div className="w-full max-w-lg mt-10">
        <UrlInput /> {/* <-- 2. Render the component */}
      </div>

      {/* Placeholder for Menu Results */}
      <div className="w-full max-w-2xl mt-10">
        {/* Results component will go here */}
      </div>

    </div>
  );
}

export default App;