import React, { useState, useEffect } from 'react';
import { MenuResponse } from '../types/menu';

interface JsonDisplayProps {
    data: MenuResponse | null;
}

/**
 * Component for displaying JSON data in a readable format
 * Includes copy to clipboard functionality
 */
const JsonDisplay: React.FC<JsonDisplayProps> = ({ data }) => {
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

    /**
     * Reset copy status when data changes
     */
    useEffect(() => {
        setCopyStatus('idle');
    }, [data]);

    if (!data) {
        return null;
    }

    const jsonString = JSON.stringify(data, null, 2);

    /**
     * Copies JSON to clipboard
     */
    const handleCopy = () => {
        navigator.clipboard.writeText(jsonString)
            .then(() => {
                setCopyStatus('copied');
                setTimeout(() => setCopyStatus('idle'), 1500);
            })
            .catch(err => {
                console.error('Failed to copy JSON:', err);
            });
    };

    return (
        <div className="relative overflow-hidden min-h-full">
            <button
                onClick={handleCopy}
                className="absolute top-2 right-2 px-3 py-1 text-xs bg-zinc-700 text-gray-300 rounded hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-dxh-primary focus:ring-offset-2 focus:ring-offset-zinc-900 transition-colors duration-150"
                aria-label={copyStatus === 'idle' ? 'Copy JSON to clipboard' : 'JSON copied!'}
            >
                {copyStatus === 'idle' ? '📋 Copy' : '✅ Copied!'}
            </button>

            <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap break-words overflow-x-auto pt-7">
                {jsonString}
            </pre>
        </div>
    );
};

export default JsonDisplay;