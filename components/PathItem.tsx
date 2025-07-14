import React, { useState, useEffect, useRef } from 'react';
import { PathItemObject, httpMethods, Path, OpenAPIObject, HttpMethod, OperationObject } from '../types.ts';
import { Operation } from './Operation.tsx';
import { EditableField } from './EditableField.tsx';
import { TrashIcon, PlusIcon } from './icons.tsx';
import { Dropdown } from './Dropdown.tsx';

interface PathItemProps {
    path: string;
    pathItem: PathItemObject;
    spec: OpenAPIObject;
    onUpdate: (path: Path, value: any) => void;
    onAddItem: (path: Path, value: any) => void;
    onRemoveItem: (path: Path) => void;
    onRenameKey: (path: Path, oldKey: string, newKey: string) => void;
    onToggleRequired: (schemaPath: Path, propertyKey: string, makeRequired: boolean) => void;
}

const methodStyles: Record<string, { base: string, enabled: string, active: string }> = {
    get:    { base: 'text-dracula-green/40 hover:text-dracula-green', enabled: 'text-dracula-green', active: 'bg-dracula-green/10 border-dracula-green text-dracula-green' },
    post:   { base: 'text-dracula-cyan/40 hover:text-dracula-cyan', enabled: 'text-dracula-cyan', active: 'bg-dracula-cyan/10 border-dracula-cyan text-dracula-cyan' },
    put:    { base: 'text-dracula-purple/40 hover:text-dracula-purple', enabled: 'text-dracula-purple', active: 'bg-dracula-purple/10 border-dracula-purple text-dracula-purple' },
    delete: { base: 'text-dracula-red/40 hover:text-dracula-red', enabled: 'text-dracula-red', active: 'bg-dracula-red/10 border-dracula-red text-dracula-red' },
    patch:  { base: 'text-dracula-orange/40 hover:text-dracula-orange', enabled: 'text-dracula-orange', active: 'bg-dracula-orange/10 border-dracula-orange text-dracula-orange' },
    options:{ base: 'text-gray-400/40 hover:text-gray-400', enabled: 'text-gray-400', active: 'bg-gray-400/10 border-gray-400 text-gray-400' },
    head:   { base: 'text-gray-400/40 hover:text-gray-400', enabled: 'text-gray-400', active: 'bg-gray-400/10 border-gray-400 text-gray-400' },
    trace:  { base: 'text-gray-400/40 hover:text-gray-400', enabled: 'text-gray-400', active: 'bg-gray-400/10 border-gray-400 text-gray-400' },
};

const AddMethodButton: React.FC<{ unusedMethods: HttpMethod[], onAdd: (method: HttpMethod) => void }> = ({ unusedMethods, onAdd }) => {
    if (unusedMethods.length === 0) return null;

    return (
        <Dropdown
            align="right"
            contentClassName="w-48"
            trigger={(ref, props) => (
                <button
                    ref={ref}
                    {...props}
                    className="h-full flex items-center justify-center rounded-md px-3 bg-gray-100 dark:bg-dracula-current hover:bg-gray-200 dark:hover:bg-dracula-bg transition-colors"
                >
                    <PlusIcon className="h-4 w-4 text-gray-500 dark:text-dracula-fg" />
                    <span className="text-xs ml-1">MORE</span>
                </button>
            )}
        >
            {(close) => (
                <>
                    {unusedMethods.map(method => (
                        <button
                            key={method}
                            onClick={() => {
                                onAdd(method);
                                close();
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-dracula-fg hover:bg-gray-100 dark:hover:bg-dracula-bg"
                        >
                            {method.toUpperCase()}
                        </button>
                    ))}
                </>
            )}
        </Dropdown>
    );
};


export const PathItem: React.FC<PathItemProps> = ({ path, pathItem, spec, onUpdate, onAddItem, onRemoveItem, onRenameKey, onToggleRequired }) => {
    
    const [activeMethod, setActiveMethod] = useState<HttpMethod | null>(() => httpMethods.find(m => pathItem[m]) || null);
    
    const primaryMethods: HttpMethod[] = ['get', 'post', 'put', 'delete', 'patch'];
    const otherMethods = httpMethods.filter(m => !primaryMethods.includes(m));
    const unusedOtherMethods = otherMethods.filter(m => !pathItem[m]);
    
    useEffect(() => {
        const availableMethods = httpMethods.filter(m => pathItem[m]);
        if (availableMethods.length > 0) {
            if (!activeMethod || !availableMethods.includes(activeMethod)) {
                setActiveMethod(availableMethods[0]);
            }
        } else {
            setActiveMethod(null);
        }
    }, [pathItem, activeMethod]);


    const handlePathRename = (newPath: string) => {
        onRenameKey(['paths'], path, newPath);
    };
    
    const handleToggleMethod = (method: HttpMethod, enable: boolean) => {
        if (enable) {
            if (!method || pathItem[method]) return;
            const newOp: Partial<OperationObject> = { 
                summary: `New ${method.toUpperCase()} operation`, 
                responses: { '200': { description: 'Successful operation' } } 
            };
            
            onUpdate(['paths', path, method], newOp);
            setActiveMethod(method);
        } else {
             onRemoveItem(['paths', path, method]);
        }
    }
    
    return (
        <div className="border border-gray-200 dark:border-dracula-current rounded-xl overflow-hidden shadow-lg bg-white dark:bg-dracula-current/30">
            <div className="bg-gray-50 dark:bg-dracula-current/50 p-4 flex justify-between items-center">
                <div className="flex-grow">
                    <EditableField
                        initialValue={path}
                        onSave={handlePathRename}
                        className="font-mono text-xl font-bold"
                    >
                        <span>{String(path)}</span>
                    </EditableField>
                     <p className="text-xs text-gray-400 dark:text-dracula-comment mt-1 pl-1">
                        Example: /v2/customers/bulk/manualCurrencyAllocate
                    </p>
                    <EditableField
                        initialValue={pathItem.summary || ''}
                        onSave={(value) => onUpdate(['paths', path, 'summary'], value)}
                        className="text-gray-500 dark:text-dracula-comment hidden md:block flex-grow mt-2"
                    >
                        <span>{String(pathItem.summary || 'No summary')}</span>
                    </EditableField>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); onRemoveItem(['paths', path]); }} className="text-gray-400 hover:text-red-500 dark:hover:text-dracula-red opacity-50 hover:opacity-100 transition-opacity">
                        <TrashIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>
            
            
            <div>
                <div className="border-b border-gray-200 dark:border-dracula-current">
                    <div className="flex space-x-1 p-2 items-center" aria-label="Tabs">
                        {primaryMethods.map(method => {
                            const isEnabled = !!pathItem[method];
                            const isActive = activeMethod === method;
                            const styles = methodStyles[method];

                            let stateStyle = styles.base;
                            if (isEnabled) stateStyle = styles.enabled;
                            if (isActive) stateStyle = `${styles.enabled} ${styles.active}`;
                            
                            return (
                                <button
                                    key={method}
                                    onClick={() => handleToggleMethod(method, !isEnabled)}
                                    onMouseEnter={() => isEnabled && setActiveMethod(method)}
                                    className={`flex-1 font-bold text-base uppercase rounded-md py-2 px-1 border-b-2 transition-all duration-200 ${stateStyle}`}
                                >
                                    {method}
                                </button>
                            );
                        })}
                        <div className="h-8">
                             <AddMethodButton 
                                unusedMethods={unusedOtherMethods} 
                                onAdd={(method) => handleToggleMethod(method, true)} 
                            />
                        </div>
                    </div>
                </div>
                {activeMethod && pathItem[activeMethod] ? (
                    <div className="p-4 md:p-6">
                        <Operation
                            key={activeMethod}
                            method={activeMethod}
                            operation={pathItem[activeMethod] as any}
                            path={['paths', path, activeMethod]}
                            spec={spec}
                            onUpdate={onUpdate}
                            onAddItem={onAddItem}
                            onRemoveItem={onRemoveItem}
                            onRenameKey={onRenameKey}
                            onToggleRequired={onToggleRequired}
                        />
                    </div>
                ) : (
                     <div className="p-6 text-center text-gray-500 dark:text-dracula-comment">
                        <p>No method is enabled or selected for this endpoint.</p>
                        <p>Click a method above to enable and edit it.</p>
                    </div>
                )}
            </div>
            
        </div>
    );
};