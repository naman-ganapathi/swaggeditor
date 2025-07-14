import get from 'lodash-es/get';
import { OpenAPIObject, Path } from '../types.ts';

/**
 * Resolves a $ref pointer to the corresponding object in the spec.
 * @param spec The full OpenAPI specification object.
 * @param ref The $ref string (e.g., '#/components/schemas/Pet').
 * @returns The referenced object, or null if not found.
 */
export const resolveRef = (spec: OpenAPIObject, ref: string): any | null => {
    if (!ref.startsWith('#/')) {
        console.warn(`[resolveRef] Cannot resolve external or invalid reference: ${ref}`);
        return null;
    }
    const path = ref.substring(2).split('/');
    return get(spec, path, null);
};

/**
 * Converts a $ref string to a lodash-style path array for editing.
 * @param ref The $ref string (e.g., '#/components/schemas/Pet').
 * @returns A path array (e.g., ['components', 'schemas', 'Pet']).
 */
export const schemaPathFromRef = (ref: string): Path => {
    if (!ref.startsWith('#/')) {
        return [];
    }
    return ref.substring(2).split('/');
};