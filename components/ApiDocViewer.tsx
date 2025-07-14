import React, { useState, useEffect } from 'react';
import { OpenAPIObject, Path, ServerObject, ServerVariableObject } from '../types.ts';
import { EditableField } from './EditableField.tsx';
import { PathItem } from './PathItem.tsx';
import { PlusIcon, TrashIcon } from './icons.tsx';
import { SecurityEditor } from './SecurityEditor.tsx';

interface ApiDocViewerProps {
    spec: OpenAPIObject;
    onUpdate: (path: Path, value: any) => void;
    onAddItem: (path: Path, value: any) => void;
    onRemoveItem: (path: Path) => void;
    onRenameKey: (path: Path, oldKey: string, newKey: string) => void;
    onToggleRequired: (schemaPath: Path, propertyKey: string, makeRequired: boolean) => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode; onAdd?: () => void, addLabel?: string }> = ({ title, children, onAdd, addLabel }) => (
    <section className="p-6 md:p-8 border-b border-gray-200 dark:border-dracula-current">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-dracula-purple dark:text-dracula-cyan tracking-tight">{title}</h2>
             {onAdd && (
                <button onClick={onAdd} className="flex items-center space-x-1.5 text-sm font-semibold text-white bg-dracula-purple hover:bg-dracula-pink dark:bg-dracula-cyan dark:hover:bg-dracula-green dark:text-black rounded-md px-3 py-1.5 transition-colors">
                    <PlusIcon className="h-4 w-4" />
                    <span>{addLabel || 'Add'}</span>
                </button>
            )}
        </div>
        {children}
    </section>
);

const ServerVariablesEditor: React.FC<{ 
    server: ServerObject; 
    serverPath: Path; 
    onUpdate: ApiDocViewerProps['onUpdate'];
    onAddItem: ApiDocViewerProps['onAddItem'];
    onRemoveItem: ApiDocViewerProps['onRemoveItem'];
    onRenameKey: ApiDocViewerProps['onRenameKey'];
}> = ({ server, serverPath, onUpdate, onAddItem, onRemoveItem, onRenameKey }) => {
    const variables = server.variables || {};
    
    const handleAddVariable = () => {
        const newVarName = `newVar${Date.now() % 1000}`;
        onAddItem([...serverPath, 'variables'], { [newVarName]: { default: 'value', description: 'New variable' } });
    };

    if (Object.keys(variables).length === 0 && !server.url.includes('{')) {
        return null;
    }

    return (
        <div className="mt-4 pt-4 border-t border-dracula-purple/20">
            <h4 className="font-semibold text-base text-gray-600 dark:text-dracula-fg/80 mb-3">URL Variables</h4>
            <div className="space-y-3">
                {Object.entries(variables).map(([varName, variableValue]) => {
                    const variable = variableValue as ServerVariableObject;
                    const varPath = [...serverPath, 'variables', varName];

                    return (
                        <div key={varName} className="p-3 rounded-md bg-gray-100 dark:bg-dracula-bg/50">
                            <div className="flex justify-between items-center">
                                <EditableField
                                    initialValue={varName}
                                    onSave={newKey => onRenameKey([...serverPath, 'variables'], varName, newKey)}
                                >
                                    <p className="font-mono font-bold text-dracula-pink">{varName}</p>
                                </EditableField>
                                <button onClick={() => onRemoveItem(varPath)} className="text-gray-400 hover:text-red-500 dark:hover:text-dracula-red opacity-50 hover:opacity-100 transition-opacity">
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="mt-2 space-y-2 text-sm pl-2">
                                <label className="block">
                                    <span className="font-semibold text-gray-600 dark:text-dracula-fg/80">Default:</span>
                                    <EditableField
                                        initialValue={variable.default}
                                        onSave={value => onUpdate([...varPath, 'default'], value)}
                                        inputClassName="text-sm w-full"
                                    >
                                        <span className="font-mono ml-2">{variable.default}</span>
                                    </EditableField>
                                </label>
                                <label className="block">
                                    <span className="font-semibold text-gray-600 dark:text-dracula-fg/80">Description:</span>
                                    <EditableField
                                        initialValue={variable.description || ''}
                                        onSave={value => onUpdate([...varPath, 'description'], value)}
                                        as="textarea"
                                        inputClassName="text-sm w-full"
                                    >
                                        <span className="text-gray-500 dark:text-dracula-comment ml-2 italic">{variable.description || 'No description'}</span>
                                    </EditableField>
                                </label>
                            </div>
                        </div>
                    );
                })}
            </div>
             <button onClick={handleAddVariable} className="mt-3 flex items-center space-x-2 text-sm text-blue-500 hover:text-blue-700 dark:text-dracula-cyan dark:hover:text-white p-2 w-full justify-center border-2 border-dashed border-gray-300 dark:border-dracula-comment rounded-md hover:bg-gray-100 dark:hover:bg-dracula-current/50 transition-colors">
                <PlusIcon className="h-4 w-4" />
                <span>Add URL Variable</span>
            </button>
        </div>
    );
};

export const ApiDocViewer: React.FC<ApiDocViewerProps> = (props) => {
    const { spec, onUpdate, onAddItem, onRemoveItem, onRenameKey, onToggleRequired } = props;
    const { info, servers, paths, components } = spec;
    
    const handleAddPath = () => {
        const newPathName = `/new-endpoint/${Date.now() % 1000}`;
        const newPathObject = {
            [newPathName]: {
                summary: "A new endpoint",
                description: "Details about this new endpoint.",
                get: {
                    summary: 'New GET Operation',
                    description: 'Retrieve data from this new endpoint.',
                    responses: {
                        '200': { description: 'Successful response' }
                    }
                }
            }
        };
        onAddItem(['paths'], newPathObject);
    };

    return (
        <div className="text-gray-800 dark:text-dracula-fg bg-gray-50 dark:bg-dracula-bg min-h-full">
            <div className="p-6 md:p-8 bg-gray-100 dark:bg-dracula-current/30 border-b border-gray-200 dark:border-dracula-current">
                <EditableField
                    initialValue={info.version}
                    onSave={(value) => onUpdate(['info', 'version'], value)}
                    className="float-right text-sm font-mono bg-dracula-purple/20 text-dracula-purple dark:text-dracula-cyan dark:bg-dracula-cyan/20 rounded-full px-4 py-1.5"
                >
                    v{String(info.version)}
                </EditableField>

                <EditableField
                    initialValue={info.title}
                    onSave={(value) => onUpdate(['info', 'title'], value)}
                    className="text-5xl font-extrabold tracking-tighter"
                >
                    <h1 className="text-5xl font-extrabold tracking-tighter">{String(info.title)}</h1>
                </EditableField>

                <EditableField
                    as="textarea"
                    initialValue={info.description || ''}
                    onSave={(value) => onUpdate(['info', 'description'], value)}
                    className="mt-4 text-lg text-gray-600 dark:text-gray-300"
                >
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-3xl">{String(info.description || 'No description provided.')}</p>
                </EditableField>
            </div>

            <Section title="Servers" onAdd={() => onAddItem(['servers'], { url: 'https://{host}/v1', description: 'New Server', variables: { host: { default: 'api.example.com', description: 'Production host' } } })} addLabel="Add Server">
                <div className="space-y-4">
                    {servers?.map((server, index) => (
                        <div key={index} className="flex items-start space-x-4 p-4 rounded-lg bg-white dark:bg-dracula-current/50 shadow-sm">
                            <div className="flex-grow">
                                <EditableField
                                    initialValue={server.url}
                                    onSave={(value) => onUpdate(['servers', index, 'url'], value)}
                                    className="font-mono text-dracula-green text-lg"
                                >
                                    {String(server.url)}
                                </EditableField>
                                <EditableField
                                    initialValue={server.description || ''}
                                    onSave={(value) => onUpdate(['servers', index, 'description'], value)}
                                    className="text-sm text-gray-500 dark:text-dracula-comment mt-1"
                                    as="textarea"
                                >
                                    {String(server.description || 'No description')}
                                </EditableField>
                                <ServerVariablesEditor 
                                    server={server} 
                                    serverPath={['servers', index]} 
                                    onUpdate={onUpdate}
                                    onAddItem={onAddItem}
                                    onRemoveItem={onRemoveItem}
                                    onRenameKey={onRenameKey}
                                />
                            </div>
                            <button onClick={() => onRemoveItem(['servers', index])} className="text-gray-400 hover:text-red-500 dark:hover:text-dracula-red opacity-50 hover:opacity-100 shrink-0 mt-1">
                                <TrashIcon className="h-5 w-5" />
                            </button>
                        </div>
                    ))}
                </div>
            </Section>

            <Section title="Security & Authorization">
                <SecurityEditor 
                    spec={spec}
                    securitySchemes={components?.securitySchemes}
                    onUpdate={onUpdate}
                    onAddItem={onAddItem}
                    onRemoveItem={onRemoveItem}
                    onRenameKey={onRenameKey}
                />
            </Section>

            <Section title="API Endpoints" onAdd={handleAddPath} addLabel="Add Endpoint">
                 <div className="space-y-8">
                    {Object.keys(paths).length > 0 ? (
                        Object.entries(paths).map(([path, pathItem]) => (
                            <PathItem
                                key={path}
                                spec={spec}
                                path={path}
                                pathItem={pathItem}
                                onUpdate={onUpdate}
                                onAddItem={onAddItem}
                                onRemoveItem={onRemoveItem}
                                onRenameKey={onRenameKey}
                                onToggleRequired={onToggleRequired}
                            />
                        ))
                    ) : (
                        <div className="text-center py-8 px-4 bg-gray-100 dark:bg-dracula-current/20 rounded-lg">
                            <h3 className="text-lg font-semibold">No Endpoints Defined</h3>
                            <p className="text-gray-500 dark:text-dracula-comment mt-1">
                                Click "Add Endpoint" to create your first API endpoint.
                            </p>
                        </div>
                    )}
                </div>
            </Section>
        </div>
    );
};