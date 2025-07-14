import React from 'react';
import { SecuritySchemeObject, ReferenceObject, Path, OpenAPIObject } from '../types.ts';
import { EditableField } from './EditableField.tsx';
import { PlusIcon, TrashIcon, LockClosedIcon } from './icons.tsx';
import { resolveRef, schemaPathFromRef } from './utils.ts';

interface SecurityEditorProps {
    spec: OpenAPIObject;
    securitySchemes?: { [key: string]: SecuritySchemeObject | ReferenceObject };
    onUpdate: (path: Path, value: any) => void;
    onAddItem: (path: Path, value: any) => void;
    onRemoveItem: (path: Path) => void;
    onRenameKey: (path: Path, oldKey: string, newKey: string) => void;
}

const schemeTemplates = {
    apiKey: { type: 'apiKey', in: 'header', name: 'X-API-KEY', description: 'API Key authentication' },
    http: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'HTTP Bearer token' },
};

const SubSection: React.FC<{title: string, children: React.ReactNode}> = ({ title, children }) => (
    <div className="mt-6 first:mt-0">
        <h3 className="text-xl font-semibold flex items-center gap-2">
            <LockClosedIcon className="h-5 w-5 text-dracula-comment" />
            {title}
        </h3>
        <div className="mt-3 pl-4 border-l-2 border-dracula-current/50">{children}</div>
    </div>
);

const SchemeDetails: React.FC<{ schemeName: string, scheme: SecuritySchemeObject, path: Path, onUpdate: SecurityEditorProps['onUpdate'] }> = ({ schemeName, scheme, path, onUpdate }) => {
    return (
        <div className="text-sm space-y-3 mt-3">
            <EditableField as="textarea" initialValue={scheme.description || ''} onSave={val => onUpdate([...path, 'description'], val)}>{scheme.description || 'No description.'}</EditableField>
            {scheme.type === 'apiKey' && (
                <>
                    <div className="flex items-center gap-2"><span className="font-semibold w-20">In: </span><EditableField as="select" options={[{value: 'header', label: 'Header'}, {value: 'query', label: 'Query'}]} initialValue={scheme.in || 'header'} onSave={val => onUpdate([...path, 'in'], val)}>{scheme.in}</EditableField></div>
                    <div className="flex items-center gap-2"><span className="font-semibold w-20">Name: </span><EditableField initialValue={scheme.name || ''} onSave={val => onUpdate([...path, 'name'], val)}>{scheme.name}</EditableField></div>
                </>
            )}
            {scheme.type === 'http' && (
                <>
                     <div className="flex items-center gap-2"><span className="font-semibold w-28">Scheme: </span><EditableField as="select" options={[{value: 'bearer', label: 'bearer'}, {value: 'basic', label: 'basic'}]} initialValue={scheme.scheme || 'bearer'} onSave={val => onUpdate([...path, 'scheme'], val)}>{scheme.scheme}</EditableField></div>
                    {scheme.scheme === 'bearer' && <div className="flex items-center gap-2"><span className="font-semibold w-28">Bearer Format: </span><EditableField initialValue={scheme.bearerFormat || ''} onSave={val => onUpdate([...path, 'bearerFormat'], val)}>{scheme.bearerFormat}</EditableField></div>}
                </>
            )}
        </div>
    );
};

export const SecurityEditor: React.FC<SecurityEditorProps> = ({ spec, securitySchemes, onUpdate, onAddItem, onRemoveItem, onRenameKey }) => {

    const handleAddScheme = (type: 'apiKey' | 'http') => {
        const schemeName = `${type}Auth${Date.now() % 1000}`;
        onAddItem(['components', 'securitySchemes'], { [schemeName]: schemeTemplates[type] });
    };

    return (
        <div>
            <SubSection title="Defined Security Schemes">
                <div className="space-y-4">
                    {securitySchemes && Object.entries(securitySchemes).map(([name, schemeOrRef]) => {
                        let currentScheme: SecuritySchemeObject | ReferenceObject = schemeOrRef;
                        let currentPath: Path = ['components', 'securitySchemes', name];
                        let isRef = false;

                        if ((schemeOrRef as ReferenceObject).$ref) {
                            const ref = (schemeOrRef as ReferenceObject).$ref;
                            const resolved = resolveRef(spec, ref);
                            if (!resolved) return <div key={name} className="p-2 text-red-500">Invalid reference: {ref}</div>;
                            currentScheme = resolved;
                            currentPath = schemaPathFromRef(ref);
                            isRef = true;
                        }

                        const scheme = currentScheme as SecuritySchemeObject;

                        return (
                            <div key={name} className="p-4 bg-white dark:bg-dracula-current/30 rounded-lg shadow-sm border border-gray-200 dark:border-dracula-current/50">
                                <div className="flex justify-between items-start">
                                    <EditableField initialValue={name} onSave={newName => onRenameKey(['components', 'securitySchemes'], name, newName)} className="font-bold font-mono text-lg text-dracula-cyan" isEditable={!isRef}>
                                        <span>{name}</span>
                                        {isRef && <span className="ml-2 text-xs text-dracula-comment" title={(schemeOrRef as ReferenceObject).$ref}>(ref)</span>}
                                    </EditableField>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs uppercase font-bold bg-dracula-comment text-white rounded-full px-2 py-1">{scheme.type}</span>
                                        <button onClick={() => onRemoveItem(['components', 'securitySchemes', name])} className="ml-2 text-gray-400 hover:text-red-500 opacity-50 hover:opacity-100"><TrashIcon className="h-4 w-4"/></button>
                                    </div>
                                </div>
                               <SchemeDetails schemeName={name} scheme={scheme} path={currentPath} onUpdate={onUpdate} />
                            </div>
                        )
                    })}
                     <div className="flex items-center space-x-2 pt-2">
                        <span className="text-sm font-semibold">Add new scheme:</span>
                        <button onClick={() => handleAddScheme('apiKey')} className="text-sm px-2.5 py-1 rounded-md bg-blue-100 hover:bg-blue-200 dark:bg-dracula-purple dark:hover:bg-dracula-pink dark:text-black font-semibold transition-colors">API Key</button>
                        <button onClick={() => handleAddScheme('http')} className="text-sm px-2.5 py-1 rounded-md bg-blue-100 hover:bg-blue-200 dark:bg-dracula-purple dark:hover:bg-dracula-pink dark:text-black font-semibold transition-colors">HTTP</button>
                    </div>
                     {(!securitySchemes || Object.keys(securitySchemes).length === 0) && (
                         <div className="text-center py-4 px-3 bg-gray-50 dark:bg-dracula-bg/20 rounded-md text-gray-500 dark:text-dracula-comment">No security schemes defined. Add one to get started.</div>
                     )}
                </div>
            </SubSection>
        </div>
    );
};