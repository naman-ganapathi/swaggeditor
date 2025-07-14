import React, { useState, useEffect, useRef } from 'react';
import { SchemaObject, ReferenceObject, Path, OpenAPIObject } from '../types.ts';
import { EditableField } from './EditableField.tsx';
import { PlusIcon, TrashIcon, LinkIcon, ChevronDownIcon } from './icons.tsx';
import { resolveRef, schemaPathFromRef } from './utils.ts';
import cloneDeep from 'lodash-es/cloneDeep';
import { Dropdown } from './Dropdown.tsx';


interface SchemaViewProps {
    schema: SchemaObject | ReferenceObject;
    path: Path;
    spec: OpenAPIObject;
    onUpdate: (path: Path, value: any) => void;
    onAddItem: (path: Path, value: any) => void;
    onRemoveItem: (path: Path) => void;
    onRenameKey: (path: Path, oldKey: string, newKey: string) => void;
    onToggleRequired: (schemaPath: Path, propertyKey: string, makeRequired: boolean) => void;
    isRoot?: boolean;
    visitedRefs?: string[];
}

const combinedTypes = [
    { label: 'string', value: 'string' },
    { label: 'integer (int32)', value: 'integer:int32' },
    { label: 'integer (int64)', value: 'integer:int64' },
    { label: 'float', value: 'number:float' },
    { label: 'double', value: 'number:double' },
    { label: 'boolean', value: 'boolean' },
    { label: 'date', value: 'string:date' },
    { label: 'date-time', value: 'string:date-time' },
    { label: 'enum', value: 'enum' },
    { label: 'array', value: 'array' },
    { label: 'object', value: 'object' },
];

const AddControls: React.FC<{ onAdd: (type: 'primitive' | 'object') => void }> = ({ onAdd }) => {
    return (
        <div className="mt-2 flex flex-col sm:flex-row gap-2">
            <button onClick={() => onAdd('primitive')} className="w-full flex items-center justify-center space-x-2 text-sm text-blue-500 hover:text-blue-700 dark:text-dracula-cyan dark:hover:text-white p-2 border-2 border-dashed border-gray-300 dark:border-dracula-comment rounded-md hover:bg-gray-100 dark:hover:bg-dracula-current/50 transition-colors">
                 <PlusIcon className="h-4 w-4" />
                <span>Add Parameter</span>
            </button>
             <button onClick={() => onAdd('object')} className="w-full flex items-center justify-center space-x-2 text-sm text-blue-500 hover:text-blue-700 dark:text-dracula-cyan dark:hover:text-white p-2 border-2 border-dashed border-gray-300 dark:border-dracula-comment rounded-md hover:bg-gray-100 dark:hover:bg-dracula-current/50 transition-colors">
                 <PlusIcon className="h-4 w-4" />
                <span>Add Object</span>
            </button>
        </div>
    );
};

const EnumEditor: React.FC<{ schema: SchemaObject; path: Path; onUpdate: SchemaViewProps['onUpdate'], onRemoveItem: SchemaViewProps['onRemoveItem'] }> = ({ schema, path, onUpdate, onRemoveItem }) => {
    const [newEnumValue, setNewEnumValue] = useState('');

    const handleAddEnum = () => {
        if (newEnumValue.trim() === '') return;
        const currentEnums = schema.enum || [];
        if (currentEnums.includes(newEnumValue)) return;
        onUpdate(path.concat('enum'), [...currentEnums, newEnumValue]);
        setNewEnumValue('');
    };
    
    const handleRemoveEnum = (valueToRemove: any) => {
        const newEnums = (schema.enum || []).filter(v => v !== valueToRemove);
        onUpdate(path.concat('enum'), newEnums);
    };

    const handleRemoveEnumConstraint = () => {
        const newSchema = cloneDeep(schema);
        delete newSchema.enum;
        onUpdate(path, newSchema);
    };
    
    if (schema.type === 'boolean') {
        return (
            <div className="mt-3 p-3 bg-gray-100 dark:bg-dracula-bg/50 rounded-md">
                 <h4 className="font-semibold text-sm text-gray-600 dark:text-dracula-fg/80">Enum Values</h4>
                 <div className="mt-1 space-y-1">
                    <div className="flex items-center justify-between bg-white dark:bg-dracula-current p-1.5 rounded"><span className="font-mono text-sm">true</span></div>
                    <div className="flex items-center justify-between bg-white dark:bg-dracula-current p-1.5 rounded"><span className="font-mono text-sm">false</span></div>
                 </div>
            </div>
        )
    }

    return (
        <div className="mt-3 p-3 bg-gray-100 dark:bg-dracula-bg/50 rounded-md">
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-sm text-gray-600 dark:text-dracula-fg/80">Enum Values & Default</h4>
                 <button onClick={handleRemoveEnumConstraint} className="text-xs text-gray-400 hover:text-red-500 dark:hover:text-dracula-red opacity-80 hover:opacity-100 flex items-center gap-1">
                    <TrashIcon className="h-3 w-3" />
                    Remove Enum
                </button>
            </div>
            <div className="mt-2 space-y-2">
                <label className="block text-sm">
                    <span className="font-medium">Default Value:</span>
                    <EditableField
                        initialValue={schema.default || ''}
                        onSave={(value) => onUpdate(path.concat('default'), value)}
                        inputClassName="w-full text-sm"
                    >
                         <span className="font-mono ml-2 text-dracula-purple">{schema.default || 'Not set'}</span>
                    </EditableField>
                </label>
                <div>
                    <span className="font-medium text-sm">Possible Values:</span>
                    <div className="space-y-1 mt-1">
                        {(schema.enum || []).map((enumValue, index) => (
                            <div key={index} className="flex items-center justify-between bg-white dark:bg-dracula-current p-1.5 rounded">
                                <span className="font-mono text-sm">{String(enumValue)}</span>
                                <button onClick={() => handleRemoveEnum(enumValue)} className="text-gray-400 hover:text-red-500 dark:hover:text-dracula-red opacity-50 hover:opacity-100">
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                     <div className="flex items-center space-x-2 mt-2">
                        <input
                            type="text"
                            value={newEnumValue}
                            onChange={e => setNewEnumValue(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddEnum()}
                            placeholder="Add new enum value"
                            className="flex-grow w-full bg-white dark:bg-dracula-current border border-dracula-comment/50 rounded-md p-1 text-sm focus:outline-none focus:ring-1 focus:ring-dracula-purple"
                        />
                        <button onClick={handleAddEnum} className="p-1.5 rounded-md bg-dracula-purple/80 hover:bg-dracula-purple text-white">
                            <PlusIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TypeSelector: React.FC<{
    currentValue: string;
    onSelect: (value: string) => void;
}> = ({ currentValue, onSelect }) => {
    const currentLabel = combinedTypes.find(t => t.value === currentValue)?.label || currentValue;

    return (
        <Dropdown
            align="left"
            contentClassName="w-48 max-h-60 overflow-y-auto"
            trigger={(ref, props) => (
                <button
                    ref={ref}
                    {...props}
                    className="flex items-center justify-between w-full text-left p-1 -m-1 rounded-md hover:bg-gray-200 dark:hover:bg-dracula-current"
                >
                    <span className="text-base font-semibold text-dracula-pink capitalize">{currentLabel}</span>
                    <ChevronDownIcon className={`h-5 w-5 text-dracula-comment transition-transform ${props['aria-expanded'] ? 'rotate-180' : ''}`} />
                </button>
            )}
        >
            {(close) => (
                <>
                    {combinedTypes.map(opt => (
                         <button
                            key={opt.value}
                            onClick={() => {
                                onSelect(opt.value);
                                close();
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-dracula-fg hover:bg-gray-100 dark:hover:bg-dracula-bg capitalize"
                        >
                            {opt.label}
                        </button>
                    ))}
                </>
            )}
        </Dropdown>
    );
};


export const SchemaView: React.FC<SchemaViewProps> = (props) => {
    const { schema, path, spec, onUpdate, onAddItem, onRemoveItem, onRenameKey, onToggleRequired, isRoot = false, visitedRefs = [] } = props;

    if ('$ref' in schema) {
        if (visitedRefs.includes(schema.$ref)) {
            return <div className="text-dracula-orange italic p-1">Circular Reference: {schema.$ref}</div>;
        }

        const resolvedSchema = resolveRef(spec, schema.$ref);

        if (!resolvedSchema) {
            return <div className="text-dracula-red p-1">Invalid Reference: {schema.$ref}</div>;
        }

        return (
            <div className="mt-1 p-2 border border-dashed border-dracula-comment/50 rounded-md bg-gray-50 dark:bg-dracula-bg/30 relative">
                <div className="absolute top-1 right-1 text-dracula-comment" title={`Resolved from: ${schema.$ref}`}>
                    <LinkIcon className="h-4 w-4" />
                </div>
                <SchemaView
                    {...props}
                    schema={resolvedSchema}
                    path={schemaPathFromRef(schema.$ref)}
                    visitedRefs={[...visitedRefs, schema.$ref]}
                    isRoot={false} // A resolved ref is never the absolute root of a section
                />
            </div>
        );
    }
    
    const { type = 'object', properties, items, required = [], description, example, format } = schema;
    
    const addParameter = (addType: 'primitive' | 'object') => {
        const currentProperties = schema.properties || {};
        let newKey;
        let newItem;

        if (addType === 'primitive') {
            newKey = 'newParameter';
            let i = 1;
            while(currentProperties[newKey]) {
                newKey = `newParameter${i++}`;
            }
            newItem = { type: 'string', description: 'A new parameter.' };
        } else { // object
            newKey = 'newObject';
            let i = 1;
            while(currentProperties[newKey]) {
                newKey = `newObject${i++}`;
            }
            newItem = { type: 'object', properties: {} };
        }

        onAddItem(path.concat('properties'), { [newKey]: newItem });
    };

    const handleTypeChange = (value: string) => {
        const newSchema = cloneDeep(schema); 

        if (value === 'enum') {
            if (!newSchema.type || !['string', 'number', 'integer', 'boolean'].includes(newSchema.type)) {
                newSchema.type = 'string';
            }
            newSchema.enum = newSchema.enum || [];
            if (newSchema.type === 'boolean' && newSchema.enum.length === 0) {
                newSchema.enum = [true, false];
            }
            onUpdate(path, newSchema);
            return;
        }

        delete newSchema.enum;

        let newType = value;
        let newFormat;
        if (value.includes(':')) {
            [newType, newFormat] = value.split(':');
        }

        newSchema.type = newType as SchemaObject['type'];

        if (newFormat) {
            newSchema.format = newFormat;
        } else {
            delete newSchema.format;
        }

        if (newType === 'object') {
            delete newSchema.items;
            if (!newSchema.properties) newSchema.properties = {};
        } else if (newType === 'array') {
            delete newSchema.properties;
            if (!newSchema.items) newSchema.items = { type: 'string' };
        } else {
            delete newSchema.items;
            delete newSchema.properties;
        }

        onUpdate(path, newSchema);
    };
    
    const handleNullableChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const isChecked = e.target.checked;
      const newSchema = cloneDeep(schema);
      if (isChecked) {
          newSchema.nullable = true;
      } else {
          delete newSchema.nullable;
      }
      onUpdate(path, newSchema);
    };
    
    const getCurrentTypeValue = () => {
        if (schema.enum && type !== 'boolean') return 'enum';
        if (type && format) return `${type}:${format}`;
        return type || 'object';
    }


    const renderTypeSelector = (currentPath: Path) => (
         <div className="flex items-center gap-4">
            <div className="flex-grow">
                <TypeSelector currentValue={getCurrentTypeValue()} onSelect={handleTypeChange} />
            </div>
            
            <label className="flex items-center space-x-1.5 cursor-pointer text-sm text-gray-500 dark:text-dracula-comment">
                <input
                    type="checkbox"
                    checked={!!schema.nullable}
                    onChange={handleNullableChange}
                    className="form-checkbox h-4 w-4 rounded-sm bg-gray-200 dark:bg-dracula-bg border-gray-300 dark:border-dracula-current text-dracula-purple focus:ring-dracula-purple focus:ring-offset-0 transition"
                />
                <span>Nullable</span>
            </label>
         </div>
    );

    const renderDescription = (desc: string | undefined, currentPath: Path) => {
        if (isRoot && !desc) return null;
        return (
            <EditableField as="textarea" initialValue={desc || ''} onSave={(val) => onUpdate(currentPath.concat('description'), val)}>
                <p className="text-sm text-gray-500 dark:text-dracula-comment mt-1">{String(desc || 'No description.')}</p>
             </EditableField>
        );
    };

    const renderParameter = (key: string, propSchema: SchemaObject | ReferenceObject) => {
        if (!propSchema) return null;
        const isRequired = required.includes(key);
        const propertyPath = path.concat(['properties', key]);
        return (
            <div key={key} className="p-3 bg-white dark:bg-dracula-bg/50 rounded-md border border-gray-200 dark:border-dracula-current/30">
                <div className="flex items-start justify-between">
                    <div className="flex-grow">
                        <EditableField
                            initialValue={key}
                            onSave={(newKey) => onRenameKey(path.concat('properties'), key, newKey)}
                            className="font-mono text-dracula-orange font-semibold"
                        >
                            {String(key)}
                        </EditableField>
                        <label className="flex items-center space-x-1.5 cursor-pointer text-xs text-gray-500 dark:text-dracula-comment mt-2">
                            <input
                                type="checkbox"
                                checked={isRequired}
                                onChange={(e) => onToggleRequired(path, key, e.target.checked)}
                                className="form-checkbox h-4 w-4 rounded-sm bg-gray-200 dark:bg-dracula-bg border-gray-300 dark:border-dracula-current text-dracula-purple focus:ring-dracula-purple focus:ring-offset-0 transition"
                            />
                            <span>Required</span>
                        </label>
                    </div>
                     <button onClick={() => onRemoveItem(path.concat(['properties', key]))} className="text-gray-400 hover:text-red-500 dark:hover:text-dracula-red opacity-50 hover:opacity-100 transition-opacity shrink-0 ml-2">
                        <TrashIcon className="h-4 w-4" />
                    </button>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-dracula-current/30">
                    <SchemaView 
                        {...props}
                        schema={propSchema} 
                        path={propertyPath}
                    />
                </div>
            </div>
        );
    };

    switch (type) {
        case 'object':
            return (
                <div>
                    {!isRoot && (
                        <div className="flex items-center space-x-2">
                            {renderTypeSelector(path)}
                        </div>
                    )}
                    {renderDescription(description, path)}
                    <div className="mt-4 space-y-3">
                        {properties && Object.entries(properties).map(([key, propSchema]) => renderParameter(key, propSchema))}
                        <AddControls onAdd={addParameter} />
                    </div>
                </div>
            );
        case 'array':
            const itemSchema = items && '$ref' in items ? resolveRef(spec, items.$ref) : items;
            
            return (
                <div>
                    <div className="flex items-center space-x-2">
                       {renderTypeSelector(path)}
                    </div>
                    {renderDescription(description, path)}
                    {items && (
                        <div className="ml-4 mt-2 pl-4 border-l-2 border-gray-200 dark:border-dracula-current">
                            <span className="text-sm font-semibold text-gray-500 dark:text-dracula-comment">Item Schema:</span>
                            <div className="mt-2">
                                <SchemaView 
                                    {...props}
                                    schema={items} 
                                    path={path.concat('items')}
                                />
                            </div>
                        </div>
                    )}
                </div>
            );
        default: // string, number, integer, boolean
            return (
                <div>
                    {renderTypeSelector(path)}
                    {renderDescription(description, path)}
                    {example && <div className="text-xs font-mono text-gray-500 dark:text-dracula-comment mt-1">Example: {JSON.stringify(example)}</div>}
                    
                    {schema.enum !== undefined && (
                        <EnumEditor schema={schema} path={path} onUpdate={onUpdate} onRemoveItem={onRemoveItem} />
                    )}
                </div>
            );
    }
};