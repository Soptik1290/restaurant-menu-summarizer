// client/src/App.tsx
import React from 'react';

function App() {
  return (
    <div className="p-4"> {/* Padding around the app */}
      <h1 className="text-2xl font-bold text-blue-600 underline"> {/* Large, blue, underlined heading */}
        Restaurant Menu Summarizer
      </h1>
      <p className="mt-2 text-gray-700"> {/* Top margin and gray text */}
        Enter the URL of the restaurant menu below.
      </p>
    </div>
  );
}

export default App;