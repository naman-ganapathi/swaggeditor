

import React, { useState, useEffect, useCallback, useRef } from 'react';
import yaml from 'js-yaml';
import get from 'lodash-es/get';
import set from 'lodash-es/set';
import cloneDeep from 'lodash-es/cloneDeep';
import debounce from 'lodash-es/debounce';

import { Editor } from './components/Editor.tsx';
import { defaultSpec } from './constants.ts';
import { OpenAPIObject, SpecFormat, Path } from './types.ts';
import { SunIcon, MoonIcon, FileUploadIcon, FileDownloadIcon, DocumentAddIcon, LayoutSingleIcon, LayoutSplitIcon } from './components/icons.tsx';
import { ApiDocViewer } from './components/ApiDocViewer.tsx';

export const App: React.FC = () => {
    const [specString, setSpecString] = useState(defaultSpec.trim());
    const [parsedSpec, setParsedSpec] = useState<OpenAPIObject | null>(null);
    const [parseError, setParseError] = useState<string | null>(null);
    const [specFormat, setSpecFormat] = useState<SpecFormat>('yaml');
    const [darkMode, setDarkMode] = useState(true);
    const [editorWidth, setEditorWidth] = useState(50);
    const [lastEditorWidth, setLastEditorWidth] = useState(50);
    const [showLightModeConfirm, setShowLightModeConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    
    const isUpdatingFromView = useRef(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const mainContainerRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 1500);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    const parseSpec = useCallback((currentSpec: string) => {
        if (isUpdatingFromView.current) {
            isUpdatingFromView.current = false;
            return;
        }
        try {
            const jsonParsed = JSON.parse(currentSpec);
            setParsedSpec(jsonParsed);
            setParseError(null);
            setSpecFormat('json');
        } catch (jsonError) {
            try {
                const yamlParsed = yaml.load(currentSpec);
                if (typeof yamlParsed !== 'object' || yamlParsed === null) {
                    throw new Error("Invalid YAML: content must be an object.");
                }
                setParsedSpec(yamlParsed as OpenAPIObject);
                setParseError(null);
                setSpecFormat('yaml');
            } catch (yamlError: any) {
                setParsedSpec(null);
                setParseError(yamlError.message || 'Invalid YAML or JSON format.');
            }
        }
    }, []);

    const debouncedParseSpec = useRef(debounce(parseSpec, 500)).current;

    useEffect(() => {
        debouncedParseSpec(specString);
    }, [specString, debouncedParseSpec]);

    useEffect(() => {
        if (!parsedSpec) return;
        
        isUpdatingFromView.current = true;
        try {
            if (specFormat === 'yaml') {
                const newYamlString = yaml.dump(parsedSpec);
                setSpecString(newYamlString);
            } else {
                const newJsonString = JSON.stringify(parsedSpec, null, 2);
                setSpecString(newJsonString);
            }
        } catch (e) {
            console.error("Error serializing spec:", e);
        }
    }, [parsedSpec, specFormat]);
    
    const handleSpecUpdate = useCallback((path: Path, value: any) => {
        setParsedSpec(currentSpec => {
            if (!currentSpec) return null;
            const newSpec = cloneDeep(currentSpec);
            set(newSpec, path, value);
            return newSpec;
        });
    }, []);

    const handleAddItem = useCallback((path: Path, item: any) => {
        setParsedSpec(currentSpec => {
            if (!currentSpec) return null;
            const newSpec = cloneDeep(currentSpec);
            let collection = get(newSpec, path);
            if (collection === undefined) {
                 set(newSpec, path, Array.isArray(item) ? item : [item]);
                 collection = get(newSpec, path);
            }

            if (Array.isArray(collection)) {
                collection.push(item);
            } else if (typeof collection === 'object' && collection !== null) {
                const key = Object.keys(item)[0];
                const value = Object.values(item)[0];
                collection[key] = value;
            }
            return newSpec;
        });
    }, []);
    
    const handleRemoveItemByPath = useCallback((path: Path) => {
        setParsedSpec(currentSpec => {
            if (!currentSpec) return null;
            const newSpec = cloneDeep(currentSpec);
            const parentPath = path.slice(0, -1);
            const itemKey = path.slice(-1)[0];
            const parent = get(newSpec, parentPath);
            if (Array.isArray(parent)) {
                 parent.splice(Number(itemKey), 1);
            } else if (typeof parent === 'object' && parent !== null) {
                delete parent[itemKey];
            }
            return newSpec;
        });
    }, []);

    const handleRenameKey = useCallback((path: Path, oldKey: string, newKey: string) => {
        if (oldKey === newKey) return;
        setParsedSpec(currentSpec => {
            if (!currentSpec) return null;
            const newSpec = cloneDeep(currentSpec);
            const obj = get(newSpec, path);
            if (obj && typeof obj === 'object' && oldKey in obj) {
                const val = obj[oldKey];
                delete obj[oldKey];
                obj[newKey] = val;
            }
            return newSpec;
        });
    }, []);

    const handleToggleRequired = useCallback((schemaPath: Path, propertyKey: string, makeRequired: boolean) => {
        setParsedSpec(currentSpec => {
            if (!currentSpec) return null;
            const newSpec = cloneDeep(currentSpec);
            const schema = get(newSpec, schemaPath);

            if (schema && typeof schema === 'object') {
                if (!schema.required) {
                    schema.required = [];
                }
                const requiredArray = schema.required as string[];
                const keyIndex = requiredArray.indexOf(propertyKey);
                
                if (makeRequired && keyIndex === -1) {
                    requiredArray.push(propertyKey);
                } else if (!makeRequired && keyIndex > -1) {
                    requiredArray.splice(keyIndex, 1);
                }

                if (requiredArray.length === 0) {
                    delete schema.required;
                }
            }
            return newSpec;
        });
    }, []);
    
    const handleFileLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                setSpecString(content);
            };
            reader.readAsText(file);
        }
        if(event.target) event.target.value = '';
    };

    const handleDownload = () => {
        if (!parsedSpec) return;
        const blob = new Blob([specString], { type: specFormat === 'json' ? 'application/json' : 'application/x-yaml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `openapi-spec.${specFormat}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleResize = (e: React.MouseEvent) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = mainContainerRef.current!.children[0].clientWidth;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const dx = moveEvent.clientX - startX;
            const newWidth = startWidth + dx;
            const containerWidth = mainContainerRef.current!.clientWidth;
            const newWidthPercent = (newWidth / containerWidth) * 100;
            if (newWidthPercent > 15 && newWidthPercent < 85) {
                setEditorWidth(newWidthPercent);
                setLastEditorWidth(newWidthPercent);
            }
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleThemeToggle = () => {
        if (darkMode) {
            setShowLightModeConfirm(true);
        } else {
            setDarkMode(true);
        }
    };

    const confirmLightMode = () => {
        setDarkMode(false);
        setShowLightModeConfirm(false);
    };

    const cancelLightMode = () => {
        setShowLightModeConfirm(false);
    };

    const showEditorOnly = () => setEditorWidth(100);
    const showViewerOnly = () => setEditorWidth(0);
    const showSplitView = () => setEditorWidth(lastEditorWidth);

    const AppHeader = () => (
        <header className="bg-white dark:bg-dracula-current border-b border-gray-200 dark:border-dracula-comment p-2 flex justify-between items-center z-10 shrink-0">
            <div className="flex items-center space-x-4">
                <h1 className="text-xl font-bold text-dracula-purple flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" version="1.0" viewBox="0 0 1600 1600" className="h-24 w-24" fill="currentColor"><path d="M501 764v24h24v24h24v24h24v24h167v-24h24v-24h24v-48h47v48h24v24h24v24h143v-24h24v-24h24v-24h24v-48H501zm72 12v12h23v24h-24v-24h-23v-24h24zm47 0v12h25v24h23v24h-24v-24h-24v24h-23v-24h23v-24h-23v-24h23zm263 0v12h24v-24h24v24h24v24h24v24h-25v-24h-23v24h-24v-24h-24v-24h-24v-24h24z"/><path d="M907 800v12h24v-24h-24z"/></svg>
                    <span>Swaggeditor</span>
                </h1>
                <div className="flex items-center space-x-1 bg-gray-100 dark:bg-dracula-bg rounded-lg p-1">
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-dracula-current transition-colors text-sm">
                        <FileUploadIcon className="h-5 w-5"/> <span>Upload</span>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileLoad} className="hidden" accept=".json,.yaml,.yml"/>
                    <button onClick={handleDownload} disabled={!parsedSpec} className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-dracula-current transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                        <FileDownloadIcon className="h-5 w-5"/> <span>Download</span>
                    </button>
                    <button onClick={() => setSpecString(defaultSpec.trim())} className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-dracula-current transition-colors text-sm">
                        <DocumentAddIcon className="h-5 w-5"/> <span>Sample</span>
                    </button>
                </div>
            </div>
            <div className="flex items-center space-x-2">
                 <div className="flex items-center space-x-1 bg-gray-100 dark:bg-dracula-bg rounded-lg p-1">
                    <button onClick={showEditorOnly} title="Editor only" className={`p-2 rounded-md transition-colors ${editorWidth === 100 ? 'bg-white dark:bg-dracula-current shadow' : 'hover:bg-gray-200 dark:hover:bg-dracula-current'}`}>
                        <LayoutSingleIcon className="h-5 w-5" />
                    </button>
                    <button onClick={showSplitView} title="Split view" className={`p-2 rounded-md transition-colors ${editorWidth > 0 && editorWidth < 100 ? 'bg-white dark:bg-dracula-current shadow' : 'hover:bg-gray-200 dark:hover:bg-dracula-current'}`}>
                        <LayoutSplitIcon className="h-5 w-5" />
                    </button>
                    <button onClick={showViewerOnly} title="Viewer only" className={`p-2 rounded-md transition-colors ${editorWidth === 0 ? 'bg-white dark:bg-dracula-current shadow' : 'hover:bg-gray-200 dark:hover:bg-dracula-current'}`}>
                        <LayoutSingleIcon className="h-5 w-5" />
                    </button>
                </div>
                <button onClick={handleThemeToggle} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-dracula-bg transition-colors">
                    {darkMode ? <SunIcon className="h-6 w-6 text-dracula-yellow" /> : <MoonIcon className="h-6 w-6 text-dracula-comment" />}
                </button>
            </div>
        </header>
    );

    return (
        <>
            <div 
                className={`fixed inset-0 bg-dracula-bg flex items-center justify-center transition-opacity duration-500 ease-in-out z-50 ${isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                aria-hidden={!isLoading}
            >
                <div className="animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" version="1.0" viewBox="0 0 1600 1600" className="h-96 w-96 text-dracula-purple" fill="currentColor"><path d="M501 764v24h24v24h24v24h24v24h167v-24h24v-24h24v-48h47v48h24v24h24v24h143v-24h24v-24h24v-24h24v-48H501zm72 12v12h23v24h-24v-24h-23v-24h24zm47 0v12h25v24h23v24h-24v-24h-24v24h-23v-24h23v-24h-23v-24h23zm263 0v12h24v-24h24v24h24v24h24v24h-25v-24h-23v24h-24v-24h-24v-24h-24v-24h24z"/><path d="M907 800v12h24v-24h-24z"/></svg>
                </div>
            </div>

            <div className={`h-screen w-screen flex flex-col font-sans transition-opacity duration-700 delay-200 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
                <AppHeader />
                <main ref={mainContainerRef} className="flex-grow flex flex-row overflow-hidden">
                    <div className="h-full overflow-y-auto transition-all duration-300" style={{ width: `${editorWidth}%` }}>
                        {editorWidth > 0 && <Editor value={specString} onChange={setSpecString} error={parseError} />}
                    </div>
                    
                    {editorWidth > 0 && editorWidth < 100 && (
                        <div 
                            onMouseDown={handleResize}
                            className="w-2 flex-shrink-0 cursor-col-resize bg-gray-200 dark:bg-dracula-comment/50 hover:bg-dracula-purple transition-colors duration-200"
                        />
                    )}
                    
                    <div className="h-full overflow-y-auto flex-1 transition-all duration-300">
                         {editorWidth < 100 && (
                            parsedSpec ? (
                                <ApiDocViewer
                                    spec={parsedSpec}
                                    onUpdate={handleSpecUpdate}
                                    onAddItem={handleAddItem}
                                    onRemoveItem={handleRemoveItemByPath}
                                    onRenameKey={handleRenameKey}
                                    onToggleRequired={handleToggleRequired}
                                />
                            ) : (
                                <div className="p-8 text-center text-gray-500">
                                    <h2 className="text-xl font-semibold">Invalid or Empty Specification</h2>
                                    <p className="mt-2">Please correct the errors in the editor, or load a valid OpenAPI specification file.</p>
                                </div>
                            )
                         )}
                    </div>
                </main>
                {showLightModeConfirm && (
                    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" role="alertdialog" aria-modal="true" aria-labelledby="dialog-title">
                        <div className="bg-white dark:bg-dracula-bg p-8 rounded-lg shadow-xl text-center max-w-sm w-full mx-4">
                            <h3 id="dialog-title" className="text-xl font-bold text-gray-900 dark:text-dracula-fg mb-4">
                                Do you really want to destroy your eyes?
                            </h3>
                            <div className="flex justify-center space-x-4 mt-6">
                                <button
                                    onClick={confirmLightMode}
                                    className="px-6 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 dark:bg-dracula-red dark:hover:bg-red-500 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-dracula-bg"
                                >
                                    Yes
                                </button>
                                <button
                                    onClick={cancelLightMode}
                                    className="px-6 py-2 rounded-md text-gray-800 dark:text-dracula-fg bg-gray-200 hover:bg-gray-300 dark:bg-dracula-current dark:hover:bg-dracula-comment font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:focus:ring-offset-dracula-bg"
                                >
                                    No
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};