import React from 'react';
import { MenuResponse } from '../types/menu'; // Importuj typ

interface JsonDisplayProps {
    data: MenuResponse | null; // Přijímá data menu (nebo null)
}

const JsonDisplay: React.FC<JsonDisplayProps> = ({ data }) => {
    if (!data) {
        return null; // Pokud nejsou data, nic nezobrazuj
    }

    // Převeď data na formátovaný JSON string
    const jsonString = JSON.stringify(data, null, 2); // null, 2 pro hezké odsazení

    return (
        // Kontejner pro JSON - tmavé pozadí, padding, zaoblení, stín, scrollování
        <div className="p-4 bg-zinc-900 border border-zinc-700 rounded-lg shadow-inner overflow-x-auto">
            {/* Použij <pre> pro zachování formátování a monospace font */}
            <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap break-words">
                {jsonString}
            </pre>
        </div>
    );
};

export default JsonDisplay;