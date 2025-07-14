import React, { useState, useEffect } from 'react';
import { OperationObject, HttpMethod, Path, ParameterObject, ResponseObject, ReferenceObject, OpenAPIObject, ExampleObject, ParameterIn } from '../types.ts';
import { EditableField } from './EditableField.tsx';
import { PlusIcon, TrashIcon, ChevronDownIcon } from './icons.tsx';
import { SchemaView } from './SchemaView.tsx';
import { resolveRef, schemaPathFromRef } from './utils.ts';
import { httpStatusCodes } from './http-status.ts';
import cloneDeep from 'lodash-es/cloneDeep';
import get from 'lodash-es/get';

// --- REFACTORED COMPONENT: JsonEditor ---
interface JsonEditorProps {
    value: string;
    onValueChange: (newValue: string) => void;
    rows?: number;
    className?: string;
}

const JsonEditor: React.FC<JsonEditorProps> = ({ value, onValueChange, rows = 5, className }) => {
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Validate initial value
        try {
            JSON.parse(value);
            setError(null);
        } catch (e) {
            setError("Invalid JSON");
        }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value;
        onValueChange(text);
        try {
            JSON.parse(text);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        }
    };
    
    const handleSaveFromObject = (obj: any) => {
        try {
            const formattedJson = JSON.stringify(obj, null, 2);
            onValueChange(formattedJson);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        }
    };


    return (
        <div className={className}>
            <textarea
                value={value}
                onChange={handleChange}
                rows={rows}
                className={`w-full font-mono text-sm bg-gray-50 dark:bg-dracula-bg dark:text-dracula-fg border rounded-md p-2 focus:ring-1 focus:ring-dracula-purple focus:outline-none ${error ? 'border-red-500 dark:border-dracula-red' : 'border-gray-300 dark:border-dracula-comment'}`}
                spellCheck="false"
            />
            {error && <p className="text-xs text-red-500 dark:text-dracula-red mt-1 font-mono">{error}</p>}
        </div>
    );
};


// --- REFACTORED COMPONENT: ExamplesEditor ---
interface ExamplesEditorProps {
    content: any; // MediaTypeObject
    contentPath: Path;
    onUpdate: (path: Path, value: any) => void;
    onAddItem: (path: Path, value: any) => void;
    onRemoveItem: (path: Path) => void;
    onRenameKey: (path: Path, oldKey: string, newKey: string) => void;
}

const ExamplesEditor: React.FC<ExamplesEditorProps> = ({ content, contentPath, onUpdate, onAddItem, onRemoveItem, onRenameKey }) => {
    
    const examples = content.examples;
    const singleExample = content.example;
    const examplesPath = [...contentPath, 'examples'];

    const handleConvertToMultiple = () => {
        if (singleExample === undefined) return;
        const key = 'default_example';
        const newExamples: { [key: string]: ExampleObject } = {
            [key]: {
                summary: 'Default example',
                value: singleExample
            }
        };
        const newContent = { ...content };
        delete newContent.example;
        newContent.examples = newExamples;
        onUpdate(contentPath, newContent);
    };

    const handleAddExample = () => {
        const summary = 'New Example';
        const key = summary.toLowerCase().replace(/\s+/g, '_') + `_${Date.now() % 1000}`;
        const newExample = { [key]: { summary, value: { success: true, message: "A new example response" } } };
        
        if (!examples) {
             onUpdate([...contentPath, 'examples'], newExample);
        } else {
            onAddItem(examplesPath, newExample);
        }
    };

    if (singleExample !== undefined) {
        return (
            <div>
                <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-400 dark:text-dracula-comment mb-2">Example Value</h4>
                <JsonEditor 
                    value={JSON.stringify(singleExample, null, 2)} 
                    onValueChange={(val) => {
                        try { onUpdate([...contentPath, 'example'], JSON.parse(val)) } catch(e) {}
                    }}
                 />
                <button onClick={handleConvertToMultiple} className="mt-3 w-full text-center text-sm p-1.5 bg-gray-100 dark:bg-dracula-bg/50 hover:bg-gray-200 dark:hover:bg-dracula-current/80 rounded-md transition-colors text-gray-600 dark:text-dracula-fg/80">
                    Convert to Multiple Examples
                </button>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center">
                <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-400 dark:text-dracula-comment">Examples</h4>
                <button onClick={handleAddExample} className="flex items-center space-x-1 text-sm font-semibold text-dracula-purple hover:text-dracula-pink dark:text-dracula-cyan dark:hover:text-white transition-colors">
                    <PlusIcon className="h-4 w-4" />
                    <span>Add Example</span>
                </button>
            </div>
            <div className="space-y-3 mt-2">
                {examples && Object.entries(examples).map(([key, example]: [string, any]) => (
                    <div key={key} className="p-3 bg-white dark:bg-dracula-current/20 rounded-lg border border-gray-200 dark:border-dracula-comment/30">
                        <div className="flex justify-between items-start">
                             <div className="flex-grow">
                                <label className="block text-xs font-bold uppercase text-gray-400 dark:text-dracula-comment">Key</label>
                                <EditableField
                                    initialValue={key}
                                    onSave={newKey => onRenameKey(examplesPath, key, newKey)}
                                    className="font-mono text-dracula-purple"
                                >
                                    {key}
                                </EditableField>
                            </div>
                            <button onClick={() => onRemoveItem([...examplesPath, key])} className="text-gray-400 hover:text-red-500 opacity-50 hover:opacity-100 ml-2 shrink-0"><TrashIcon className="h-4 w-4" /></button>
                        </div>
                        <div className="mt-2">
                            <label className="block text-xs font-bold uppercase text-gray-400 dark:text-dracula-comment">Summary</label>
                            <EditableField
                                as="textarea"
                                initialValue={example.summary || ''}
                                onSave={val => onUpdate([...examplesPath, key, 'summary'], val)}
                                className="text-sm text-gray-600 dark:text-dracula-fg/90 w-full"
                            >
                                <p className="text-sm text-gray-600 dark:text-dracula-fg/90">{example.summary || 'No summary'}</p>
                            </EditableField>
                        </div>
                        <div className="mt-2">
                            <label className="block text-xs font-bold uppercase text-gray-400 dark:text-dracula-comment">Value</label>
                             <JsonEditor 
                                value={JSON.stringify(example.value, null, 2)} 
                                onValueChange={(val) => {
                                    try { onUpdate([...examplesPath, key, 'value'], JSON.parse(val)) } catch(e) {}
                                }}
                                rows={8}
                            />
                        </div>
                    </div>
                ))}
                {(!examples || Object.keys(examples).length === 0) && (
                    <div className="text-center py-4 px-3 bg-gray-50 dark:bg-dracula-bg/20 rounded-md text-gray-500 dark:text-dracula-comment">
                        No examples defined. Click 'Add Example' to create one.
                    </div>
                )}
            </div>
        </div>
    );
};


interface OperationProps {
    method: HttpMethod;
    operation: OperationObject;
    path: Path;
    spec: OpenAPIObject;
    onUpdate: (path: Path, value: any) => void;
    onAddItem: (path: Path, value: any) => void;
    onRemoveItem: (path: Path) => void;
    onRenameKey: (path: Path, oldKey: string, newKey: string) => void;
    onToggleRequired: (schemaPath: Path, propertyKey: string, makeRequired: boolean) => void;
}

const SectionContainer: React.FC<{title: string, children: React.ReactNode, initiallyOpen?: boolean}> = ({ title, children, initiallyOpen = false }) => {
    const [isOpen, setIsOpen] = useState(initiallyOpen);
    return (
        <div className="mt-8 border border-gray-200 dark:border-dracula-comment rounded-lg overflow-hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-4 bg-gray-50 dark:bg-dracula-current/50 hover:bg-gray-100 dark:hover:bg-dracula-current/80 transition-colors">
                <h3 className="text-xl font-bold text-gray-800 dark:text-dracula-fg">{title}</h3>
                <ChevronDownIcon className={`h-6 w-6 text-gray-500 dark:text-dracula-comment transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && <div className="p-4 md:p-6">{children}</div>}
        </div>
    )
}

const ParameterEditor: React.FC<{
    parameter: ParameterObject,
    path: Path,
    spec: OpenAPIObject,
    onUpdate: OperationProps['onUpdate'],
    onRemove: () => void,
    onAddItem: OperationProps['onAddItem'],
    onRemoveItem: OperationProps['onRemoveItem'],
    onRenameKey: OperationProps['onRenameKey'],
    onToggleRequired: OperationProps['onToggleRequired'],
}> = ({ parameter, path, spec, onUpdate, onRemove, onAddItem, onRemoveItem, onRenameKey, onToggleRequired }) => {
    return (
        <div className="p-4 border border-gray-200 dark:border-dracula-current/50 rounded-lg bg-gray-50 dark:bg-dracula-bg/20">
            <div className="flex items-start justify-between">
                <div className="flex-grow">
                    <div className="flex items-center gap-3">
                        <EditableField initialValue={parameter.name} onSave={val => onUpdate(path.concat('name'), val)} className="font-bold font-mono text-lg text-dracula-orange">{String(parameter.name)}</EditableField>
                        <span className="text-sm bg-gray-200 dark:bg-dracula-comment rounded px-2 py-0.5 font-semibold">{String(parameter.in)}</span>
                    </div>
                    <EditableField as="textarea" initialValue={parameter.description || ''} onSave={val => onUpdate(path.concat('description'), val)} className="text-base text-gray-500 dark:text-dracula-comment mt-2 w-full">{String(parameter.description || 'No description.')}</EditableField>
                     <label className="flex items-center space-x-2 cursor-pointer text-sm mt-3">
                        <input
                            type="checkbox"
                            checked={!!parameter.required}
                            onChange={(e) => onUpdate(path.concat('required'), e.target.checked)}
                            className="h-4 w-4 rounded bg-gray-200 dark:bg-dracula-bg border-gray-300 dark:border-dracula-current text-dracula-purple focus:ring-dracula-purple focus:ring-offset-0"
                        />
                        <span className="font-semibold text-red-500 dark:text-dracula-red">Required</span>
                    </label>
                </div>
                <button onClick={onRemove} className="text-gray-400 hover:text-red-500 opacity-50 hover:opacity-100 ml-4 shrink-0"><TrashIcon className="h-5 w-5"/></button>
            </div>
            {parameter.schema && <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dracula-current/50"><SchemaView spec={spec} schema={parameter.schema} path={path.concat('schema')} onUpdate={onUpdate} onAddItem={onAddItem} onRemoveItem={onRemoveItem} onRenameKey={onRenameKey} onToggleRequired={onToggleRequired} /></div>}
        </div>
    )
}

const ParametersGroup: React.FC<{
    title: string,
    inType: ParameterIn,
    operation: OperationObject,
    operationPath: Path,
} & Omit<OperationProps, 'operation' | 'path' | 'method'>> = ({ title, inType, operation, operationPath, onAddItem, onRemoveItem, spec, ...rest }) => {
    
    const parameters = (operation.parameters || []).filter(p => {
        if (!p) return false;
        
        let paramToCheck: any = p;
        if ('$ref' in p) {
            const resolved = resolveRef(spec, (p as ReferenceObject).$ref);
            if (!resolved) return false;
            paramToCheck = resolved;
        }
        
        return paramToCheck && typeof paramToCheck === 'object' && 'in' in paramToCheck && paramToCheck.in === inType;
    });

    const addParameter = () => {
        const newItem = { name: `new${inType}Param`, in: inType, description: `New ${inType} parameter`, schema: { type: 'string' } };
        onAddItem(operationPath.concat('parameters'), newItem);
    };

    return (
        <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-gray-500 dark:text-dracula-comment">{title}</h4>
                 <button onClick={addParameter} className="flex items-center space-x-1 text-sm font-semibold text-dracula-purple hover:text-dracula-pink dark:text-dracula-cyan dark:hover:text-white transition-colors">
                    <PlusIcon className="h-4 w-4" />
                    <span>Add</span>
                </button>
            </div>
            <div className="space-y-3 border-l-2 border-gray-200 dark:border-dracula-comment/50 pl-4">
                {parameters.length > 0 ? (
                    parameters.map((param, index) => {
                        // This is tricky: the index here is for the filtered array, not the original.
                        // We need the original index to build the correct path.
                        const originalIndex = (operation.parameters || []).findIndex(p => p === param);

                        let currentParam = param;
                        let currentPath = operationPath.concat(['parameters', originalIndex]);
                        if ('$ref' in param) {
                            const resolved = resolveRef(spec, param.$ref);
                            if (!resolved) return <div key={index} className="p-2 text-red-500">Invalid reference: {param.$ref}</div>;
                            currentParam = resolved;
                            currentPath = schemaPathFromRef(param.$ref);
                        }

                        return (
                            <ParameterEditor
                                key={originalIndex}
                                parameter={currentParam as ParameterObject}
                                path={currentPath}
                                spec={spec}
                                onUpdate={rest.onUpdate}
                                onRemove={() => onRemoveItem(operationPath.concat(['parameters', originalIndex]))}
                                onAddItem={onAddItem}
                                onRemoveItem={onRemoveItem}
                                onRenameKey={rest.onRenameKey}
                                onToggleRequired={rest.onToggleRequired}
                            />
                        );
                    })
                ) : (
                    <div className="text-center py-4 px-3 bg-gray-50 dark:bg-dracula-bg/20 rounded-md text-sm text-gray-500 dark:text-dracula-comment">No {inType} parameters defined.</div>
                )}
            </div>
        </div>
    )
}

const getStatusCodeClasses = (statusCode: string) => {
    const code = parseInt(statusCode, 10);
    if (code >= 200 && code < 300) return 'border-dracula-green/50 bg-dracula-green/10 text-dracula-green';
    if (code >= 300 && code < 400) return 'border-dracula-cyan/50 bg-dracula-cyan/10 text-dracula-cyan';
    if (code >= 400 && code < 500) return 'border-dracula-orange/50 bg-dracula-orange/10 text-dracula-orange';
    if (code >= 500 && code < 600) return 'border-dracula-red/50 bg-dracula-red/10 text-dracula-red';
    return 'border-gray-400/50 bg-gray-400/10 text-gray-400';
};

const ResponseEditor: React.FC<{
    statusCode: string,
    response: ResponseObject,
    path: Path,
    spec: OpenAPIObject,
    onUpdate: OperationProps['onUpdate'],
    onRemove: () => void,
    onRenameKey: OperationProps['onRenameKey'],
    onAddItem: OperationProps['onAddItem'],
    onRemoveItem: OperationProps['onRemoveItem'],
    onToggleRequired: OperationProps['onToggleRequired'],
}> = ({ statusCode, response, path, spec, onUpdate, onRemove, onRenameKey, onAddItem, onRemoveItem, onToggleRequired }) => {
    const colorClasses = getStatusCodeClasses(statusCode);
    const content = response.content?.['application/json'];
    const contentPath = path.concat(['content', 'application/json']);
    const schema = content?.schema;
    const schemaPath = [...contentPath, 'schema'];

    return (
        <div className={`p-4 border-2 rounded-lg bg-gray-50 dark:bg-dracula-bg/20 ${colorClasses}`}>
            <div className="flex items-start justify-between">
                 <div className="flex-grow">
                    <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold font-mono px-2 py-0.5 rounded-md ${colorClasses}`}>
                            <EditableField initialValue={statusCode} onSave={newCode => onRenameKey(path.slice(0,-1), statusCode, newCode)}>{String(statusCode)}</EditableField>
                        </span>
                    </div>
                    <EditableField as="textarea" initialValue={response.description} onSave={val => onUpdate(path.concat('description'), val)} className="text-base text-gray-500 dark:text-dracula-comment mt-2 w-full">{String(response.description)}</EditableField>
                 </div>
                 <button onClick={onRemove} className="text-gray-400 hover:text-red-500 opacity-50 hover:opacity-100 ml-4 shrink-0"><TrashIcon className="h-5 w-5"/></button>
            </div>
            
            {response.content ? (
                <>
                    {content ? (
                        <>
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dracula-current/50">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-400 dark:text-dracula-comment">Response Body Parameters</h4>
                                    {schema ? (
                                        <button onClick={() => onRemoveItem(schemaPath)} className="flex items-center space-x-1 text-xs font-semibold text-red-500 hover:text-red-700 dark:text-dracula-red dark:hover:text-white transition-colors">
                                            <TrashIcon className="h-3 w-3" /><span>Remove Body</span>
                                        </button>
                                    ) : (
                                        <button onClick={() => onUpdate(schemaPath, { type: 'object', properties: {} })} className="flex items-center space-x-1 text-xs font-semibold text-blue-500 hover:text-blue-700 dark:text-dracula-cyan dark:hover:text-white transition-colors">
                                            <PlusIcon className="h-3 w-3" /><span>Add Body</span>
                                        </button>
                                    )}
                                </div>
                                {schema ?
                                    <SchemaView spec={spec} schema={schema} path={schemaPath} onUpdate={onUpdate} onAddItem={onAddItem} onRemoveItem={onRemoveItem} onRenameKey={onRenameKey} onToggleRequired={onToggleRequired} isRoot />
                                :
                                    <div className="text-center text-sm py-4 px-3 bg-gray-100 dark:bg-dracula-bg/30 rounded-md text-gray-500 dark:text-dracula-comment">No body defined for this response.</div>
                                }
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dracula-current/50">
                                <ExamplesEditor
                                    content={content}
                                    contentPath={contentPath}
                                    onUpdate={onUpdate}
                                    onAddItem={onAddItem}
                                    onRemoveItem={onRemoveItem}
                                    onRenameKey={onRenameKey}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="mt-4 text-center p-4 bg-yellow-100 dark:bg-dracula-yellow/20 rounded-md text-yellow-800 dark:text-dracula-yellow">This response has content defined, but not for 'application/json'. Editing other content types is not yet supported.</div>
                    )}
                </>
            ) : (
                <div className="mt-4 text-center">
                    <button onClick={() => onUpdate(path.concat('content'), { 'application/json': { schema: { type: 'object', properties: {} } } })} className="text-sm font-semibold text-white bg-dracula-purple hover:bg-dracula-pink dark:bg-dracula-cyan dark:hover:bg-dracula-green dark:text-black rounded-md px-4 py-2 transition-colors">
                        Add Response Body
                    </button>
                </div>
            )}
        </div>
    );
};

export const Operation: React.FC<OperationProps> = (props) => {
    const { method, operation, path, spec, onUpdate, onAddItem, onRemoveItem, onRenameKey, onToggleRequired } = props;
    const { summary, description, requestBody, responses } = operation;

    const [isAddingResponse, setIsAddingResponse] = useState(false);
    const [newStatusCode, setNewStatusCode] = useState('200');
    const [newDescription, setNewDescription] = useState('OK');
    const [newExample, setNewExample] = useState('{\n  "status": "success"\n}');
    const [addResponseError, setAddResponseError] = useState('');

     useEffect(() => {
        if (httpStatusCodes[newStatusCode]) {
            setNewDescription(httpStatusCodes[newStatusCode]);
        } else {
             if (Object.values(httpStatusCodes).includes(newDescription)) {
                setNewDescription('');
             }
        }
    }, [newStatusCode]);
    
    const handleSaveNewResponse = () => {
        if (!/^\d{3}$/.test(newStatusCode)) {
            setAddResponseError('Status code must be a 3-digit number.');
            return;
        }
        if (!newDescription.trim()) {
            setAddResponseError('Description is required.');
            return;
        }

        let exampleValue;
        try {
            exampleValue = JSON.parse(newExample);
            setAddResponseError('');
        } catch (e) {
            setAddResponseError('Example value must be valid JSON.');
            return;
        }
        
        const responsesPath = path.concat('responses');
        const responsePath = responsesPath.concat(newStatusCode);
        const existingResponse = get(spec, responsePath);

        if (existingResponse) {
             const updatedResponse = cloneDeep(existingResponse);
             const content = updatedResponse.content?.['application/json'] || { schema: { type: 'object' } };

             if (!updatedResponse.content) updatedResponse.content = {};
             if (!updatedResponse.content['application/json']) updatedResponse.content['application/json'] = content;

             if (!content.examples) content.examples = {};
            
             if (content.example !== undefined) {
                const existingDesc = updatedResponse.description || 'Default Example';
                content.examples['default_example'] = { summary: existingDesc, value: content.example };
                delete content.example;
             }
             
             const exampleKey = newDescription.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || `example_${Date.now()}`;
             let finalKey = exampleKey;
             let i = 2;
             while(content.examples[finalKey]) {
                finalKey = `${exampleKey}_${i++}`;
             }

             content.examples[finalKey] = { summary: newDescription, value: exampleValue };
             onUpdate(responsePath, updatedResponse);

        } else {
             const newResponseObject = {
                description: newDescription,
                content: {
                    'application/json': {
                        schema: { type: 'object', properties: {} },
                        example: exampleValue
                    }
                }
             };
             onAddItem(responsesPath, { [newStatusCode]: newResponseObject });
        }
        
        // Reset form
        setIsAddingResponse(false);
        setNewStatusCode('200');
        setNewDescription('OK');
        setNewExample('{\n  "status": "success"\n}');
        setAddResponseError('');
    };

    const canHaveBody = method === 'post' || method === 'put' || method === 'patch';

    return (
        <div>
            <EditableField initialValue={summary || ''} onSave={(val) => onUpdate(path.concat('summary'), val)} className="font-bold text-3xl tracking-tight">
                <h2 className="font-bold text-3xl tracking-tight">{String(summary || 'No summary')}</h2>
            </EditableField>
            
            <EditableField as="textarea" initialValue={description || ''} onSave={(val) => onUpdate(path.concat('description'), val)} className="text-gray-600 dark:text-gray-300 mt-2 text-lg">
                <p className="max-w-2xl">{String(description || 'No description provided.')}</p>
            </EditableField>

            <SectionContainer title="Parameters" initiallyOpen={(operation.parameters?.length || 0) > 0}>
                <ParametersGroup title="Path Parameters" inType="path" operation={operation} operationPath={path} {...props} />
                <ParametersGroup title="Query Parameters" inType="query" operation={operation} operationPath={path} {...props} />
                <ParametersGroup title="Header Parameters" inType="header" operation={operation} operationPath={path} {...props} />
            </SectionContainer>
            
            <SectionContainer title="Request Body" initiallyOpen={!!requestBody || canHaveBody}>
                {requestBody && 'content' in requestBody ? (
                    <div className="p-4 border border-gray-200 dark:border-dracula-current/50 rounded-lg space-y-6">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-400 dark:text-dracula-comment">Body Schema</h4>
                                <button onClick={() => onUpdate(path.concat('requestBody'), undefined)} className="flex items-center space-x-1 text-xs font-semibold text-red-500 hover:text-red-700 dark:text-dracula-red dark:hover:text-white transition-colors">
                                    <TrashIcon className="h-3 w-3" /><span>Remove Body</span>
                                </button>
                            </div>
                            <SchemaView
                                spec={spec}
                                schema={(requestBody as any).content['application/json']?.schema || {}}
                                path={path.concat(['requestBody', 'content', 'application/json', 'schema'])}
                                onUpdate={onUpdate}
                                onAddItem={onAddItem}
                                onRemoveItem={onRemoveItem}
                                onRenameKey={onRenameKey}
                                onToggleRequired={onToggleRequired}
                                isRoot
                            />
                        </div>

                        {(requestBody as any).content['application/json'] && (
                            <div className="pt-6 border-t border-gray-200 dark:border-dracula-current/50">
                                <ExamplesEditor
                                    content={(requestBody as any).content['application/json']}
                                    contentPath={path.concat(['requestBody', 'content', 'application/json'])}
                                    onUpdate={onUpdate}
                                    onAddItem={onAddItem}
                                    onRemoveItem={onRemoveItem}
                                    onRenameKey={onRenameKey}
                                />
                            </div>
                        )}
                    </div>
                ) : requestBody && '$ref' in requestBody ? (
                    <div className="p-2 text-red-500">Editing referenced Request Bodies is not yet supported: {(requestBody as ReferenceObject).$ref}</div>
                ) : canHaveBody ? (
                    <div className="text-center">
                        <button onClick={() => onUpdate(path.concat('requestBody'), { content: { 'application/json': { schema: { type: 'object', properties: {} } } } })} className="text-sm font-semibold text-white bg-dracula-purple hover:bg-dracula-pink dark:bg-dracula-cyan dark:hover:bg-dracula-green dark:text-black rounded-md px-4 py-2 transition-colors">
                            Add Request Body
                        </button>
                    </div>
                ) : (
                    <div className="text-center text-sm py-4 px-3 bg-gray-100 dark:bg-dracula-bg/30 rounded-md text-gray-500 dark:text-dracula-comment">
                        Change the method to add a request body
                    </div>
                )}
            </SectionContainer>

            <SectionContainer title="Responses" initiallyOpen={true}>
                <div className="space-y-3">
                    {responses && Object.keys(responses).length > 0 ? (
                        Object.entries(responses).map(([code, resp]) => {
                            const typedResp = resp as ResponseObject | ReferenceObject;
                            let currentResp = typedResp;
                            let currentPath = path.concat(['responses', code]);
                            if (typedResp && '$ref' in typedResp) {
                                const resolved = resolveRef(spec, typedResp.$ref);
                                if (!resolved) return <div key={code} className="p-2 text-red-500">Invalid reference: {typedResp.$ref}</div>;
                                currentResp = resolved;
                                currentPath = schemaPathFromRef(typedResp.$ref);
                            }
                            return currentResp ? (
                                    <ResponseEditor
                                        key={code}
                                        statusCode={code}
                                        response={currentResp as ResponseObject}
                                        path={currentPath}
                                        spec={spec}
                                        onUpdate={onUpdate}
                                        onRenameKey={onRenameKey}
                                        onRemove={() => onRemoveItem(path.concat(['responses', code]))}
                                        onAddItem={onAddItem}
                                        onRemoveItem={onRemoveItem}
                                        onToggleRequired={onToggleRequired}
                                    />
                            ) : null;
                        })
                    ) : (
                        !isAddingResponse && <div className="text-center py-4 px-3 bg-gray-50 dark:bg-dracula-bg/20 rounded-md text-gray-500 dark:text-dracula-comment">No responses defined.</div>
                    )}
                </div>

                <div className="mt-4">
                    {isAddingResponse ? (
                        <div className="p-6 bg-white dark:bg-dracula-current/30 rounded-lg space-y-4 border border-gray-300 dark:border-dracula-comment shadow-lg">
                             <h3 className="text-xl font-bold text-gray-900 dark:text-dracula-fg">Add New Response or Example</h3>
                             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <label className="block md:col-span-1">
                                    <span className="text-sm font-medium text-gray-700 dark:text-dracula-fg/90">Status Code</span>
                                    <input type="text" value={newStatusCode} onChange={e => setNewStatusCode(e.target.value)} className="mt-1 block w-full bg-white dark:bg-dracula-bg rounded-md border-gray-300 dark:border-dracula-comment shadow-sm focus:outline-none focus:ring-2 focus:ring-dracula-purple"/>
                                </label>
                                <label className="block md:col-span-3">
                                    <span className="text-sm font-medium text-gray-700 dark:text-dracula-fg/90">Description / Summary</span>
                                    <input type="text" value={newDescription} onChange={e => setNewDescription(e.target.value)} placeholder="e.g., Points successfully deducted" className="mt-1 block w-full bg-white dark:bg-dracula-bg rounded-md border-gray-300 dark:border-dracula-comment shadow-sm focus:outline-none focus:ring-2 focus:ring-dracula-purple"/>
                                </label>
                            </div>
                            <label className="block">
                                <span className="text-sm font-medium text-gray-700 dark:text-dracula-fg/90">Example Value (JSON)</span>
                                <JsonEditor
                                    className="mt-1"
                                    value={newExample}
                                    onValueChange={setNewExample}
                                    rows={6}
                                />
                            </label>
                            {addResponseError && <p className="text-sm text-red-500 dark:text-dracula-red mt-1">{addResponseError}</p>}
                            <div className="flex justify-end gap-2 pt-2">
                                <button onClick={() => setIsAddingResponse(false)} className="px-4 py-2 rounded-md text-gray-800 dark:text-dracula-fg bg-gray-200 hover:bg-gray-300 dark:bg-dracula-current dark:hover:bg-dracula-comment font-semibold transition-colors text-sm">
                                    Cancel
                                </button>
                                <button onClick={handleSaveNewResponse} className="px-4 py-2 rounded-md text-white bg-dracula-purple hover:bg-dracula-pink dark:bg-dracula-cyan dark:text-black dark:hover:bg-dracula-green font-semibold transition-colors text-sm">
                                    Save Response
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => setIsAddingResponse(true)} className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-dracula-comment rounded-lg text-sm font-medium text-gray-500 dark:text-dracula-fg/80 hover:text-dracula-purple hover:border-dracula-purple dark:hover:text-dracula-cyan dark:hover:border-dracula-cyan transition-colors">
                            <PlusIcon className="h-5 w-5"/> Add Response
                        </button>
                    )}
                </div>

            </SectionContainer>
        </div>
    );
};