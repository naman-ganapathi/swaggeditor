
import React, { useState, useEffect, useRef, ReactNode } from 'react';

type InputType = 'input' | 'textarea' | 'select';

interface EditableFieldProps {
    children: ReactNode;
    onSave: (value: string) => void;
    initialValue: string | number;
    className?: string;
    inputClassName?: string;
    as?: InputType;
    options?: { value: string, label: string }[];
    isEditable?: boolean;
}

export const EditableField: React.FC<EditableFieldProps> = ({
    children,
    onSave,
    initialValue,
    className,
    inputClassName,
    as = 'input',
    options,
    isEditable = true,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(String(initialValue));
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);

    useEffect(() => {
        setValue(String(initialValue));
    }, [initialValue]);

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            if (inputRef.current instanceof HTMLInputElement || inputRef.current instanceof HTMLTextAreaElement) {
                inputRef.current.select();
            }
        }
    }, [isEditing]);

    const handleSave = () => {
        if (String(initialValue) !== value) {
            onSave(value);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && as !== 'textarea') {
            handleSave();
        } else if (e.key === 'Escape') {
            setValue(String(initialValue));
            setIsEditing(false);
        }
    };
    
    if (!isEditable) {
        return <span className={className}>{children}</span>;
    }

    if (isEditing) {
        const commonProps = {
            ref: inputRef as any,
            value: value,
            onChange: (e: React.ChangeEvent<any>) => setValue(e.target.value),
            onBlur: handleSave,
            onKeyDown: handleKeyDown,
            className: `w-full bg-white dark:bg-dracula-current border border-dracula-purple rounded-md p-1 -m-1 focus:outline-none focus:ring-2 focus:ring-dracula-purple ${inputClassName}`,
        };

        if (as === 'textarea') {
            return <textarea {...commonProps} rows={3}></textarea>;
        }

        if (as === 'select') {
            return (
                <select {...commonProps}>
                    {options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
            );
        }

        return <input type="text" {...commonProps} />;
    }

    return (
        <div onClick={() => setIsEditing(true)} className={`cursor-pointer hover:bg-gray-200 dark:hover:bg-dracula-current rounded-md p-1 -m-1 ${className}`}>
            {children}
        </div>
    );
};
