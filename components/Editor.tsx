
import React from 'react';

interface EditorProps {
    value: string;
    onChange: (value: string) => void;
    error?: string | null;
}

export const Editor: React.FC<EditorProps> = ({ value, onChange, error }) => {
    return (
        <div className="h-full flex flex-col">
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="flex-grow w-full p-4 font-mono text-sm bg-white dark:bg-dracula-bg dark:text-dracula-fg border-none focus:ring-0 resize-none outline-none"
                spellCheck="false"
            />
            {error && (
                <div className="p-2 text-sm bg-red-100 dark:bg-dracula-red text-red-800 dark:text-white font-mono whitespace-pre-wrap shrink-0">
                    {error}
                </div>
            )}
        </div>
    );
};
