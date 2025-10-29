import React, { useState, useEffect, useRef } from 'react';

interface SubmittedUrlPillProps {
  url: string;              // Currently displayed URL
  onRefresh: () => void;    // Refresh the CURRENT URL
  onSubmitNew: (newUrl: string) => void; // Submit a NEW URL
  isLoading: boolean;
}

const SubmittedUrlPill: React.FC<SubmittedUrlPillProps> = ({ url, onRefresh, onSubmitNew, isLoading }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUrl, setEditedUrl] = useState(url);
  const inputRef = useRef<HTMLInputElement>(null); // Ref to focus the input

  // Focus input when edit mode is enabled
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select(); // Select text for quick overwrite
    }
  }, [isEditing]);

  // Reset editedUrl when prop `url` changes (e.g., after successful submit)
  useEffect(() => {
    if (!isEditing) {
      setEditedUrl(url);
    }
  }, [url, isEditing]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditedUrl(event.target.value);
  };

  // Submit new URL (Enter in input or click arrow)
  const handleNewSubmit = (event?: React.FormEvent) => {
    event?.preventDefault(); // Prevent page reload when triggered from form
    if (!isLoading && editedUrl && editedUrl !== url) {
      onSubmitNew(editedUrl);
    }
    setIsEditing(false); // Always exit edit mode after submit
  };

  // Cancel editing (e.g., Esc)
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setIsEditing(false);
      setEditedUrl(url); // Revert to original URL
    }
  };

  // Handle blur on the entire form (clicking outside)
  const handleBlur = (event: React.FocusEvent<HTMLFormElement>) => {
    // relatedTarget is the newly focused element
    if (event.relatedTarget === null || !event.currentTarget.contains(event.relatedTarget)) {
      setIsEditing(false);
      setEditedUrl(url);
    }
  };

  // Wrap with form to handle Enter
  return (
    <form
      onSubmit={handleNewSubmit}
      onBlur={handleBlur}
      className={`flex items-center justify-between w-full max-w-lg p-2 bg-zinc-800/80 backdrop-blur-lg border border-zinc-700 rounded-full shadow-lg transition-all duration-300 ${isEditing ? 'scale-105' : 'scale-100'}`}
    >
      {isEditing ? (
        <>
          <input
            ref={inputRef}
            type="url"
            value={editedUrl}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            required
            disabled={isLoading}
            className="flex-grow text-sm text-gray-100 bg-zinc-700 rounded-full px-4 py-1.5 mx-1 border border-transparent focus:outline-none focus:ring-2 focus:ring-dxh-primary focus:border-transparent"
          />
          <button
            type="submit"
            disabled={isLoading || !editedUrl || editedUrl === url}
            className={`flex items-center justify-center w-8 h-8 bg-dxh-primary text-zinc-900 rounded-full ml-1
                       hover:bg-[#25c4ac] focus:outline-none focus:ring-2 focus:ring-dxh-primary focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-label="Submit new URL"
          >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
               <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
             </svg>
          </button>
        </>
      ) : (
        <>
          <span
            onClick={handleEditClick}
            className="flex-grow text-sm text-gray-300 bg-zinc-700/50 rounded-full px-4 py-1.5 mr-3 truncate cursor-pointer hover:bg-zinc-700/80"
            title="Click to edit URL"
          >
            {url}
          </span>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center justify-center w-8 h-8 bg-zinc-700 text-gray-400 rounded-full
                       hover:bg-zinc-600 hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-dxh-primary focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Refresh current URL"
          >
            {isLoading ? (
               <svg className="animate-spin h-5 w-5 text-dxh-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
           ) : (
             <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 4.5V7.5h3l-3.75-3.75M7.5 19.5V16.5h-3l3.75 3.75M3.5 12a8.5 8.5 0 0 1 13.2-6.5M20.5 12a8.5 8.5 0 0 1-13.2 6.5"
              />
            </svg>
           )}
          </button>
        </>
      )}
    </form>
  );
};

export default SubmittedUrlPill;