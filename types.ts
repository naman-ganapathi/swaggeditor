

export type SpecFormat = 'json' | 'yaml';

export interface OpenAPIObject {
    openapi: string;
    info: InfoObject;
    servers?: ServerObject[];
    paths: PathsObject;
    components?: ComponentsObject;
    security?: SecurityRequirementObject[];
    tags?: TagObject[];
    externalDocs?: ExternalDocumentationObject;
}

export interface InfoObject {
    title: string;
    description?: string;
    termsOfService?: string;
    contact?: ContactObject;
    license?: LicenseObject;
    version: string;
}

export interface ContactObject {
    name?: string;
    url?: string;
    email?: string;
}

export interface LicenseObject {
    name: string;
    url?: string;
}

export interface ServerObject {
    url: string;
    description?: string;
    variables?: { [key: string]: ServerVariableObject };
}

export interface ServerVariableObject {
    enum?: string[];
    default: string;
    description?: string;
}

export interface PathsObject {
    [path: string]: PathItemObject;
}

export interface PathItemObject {
    $ref?: string;
    summary?: string;
    description?: string;
    get?: OperationObject;
    put?: OperationObject;
    post?: OperationObject;
    delete?: OperationObject;
    options?: OperationObject;
    head?: OperationObject;
    patch?: OperationObject;
    trace?: OperationObject;
    servers?: ServerObject[];
    parameters?: (ParameterObject | ReferenceObject)[];
}

export type HttpMethod = 'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace';

export const httpMethods: HttpMethod[] = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];

export interface OperationObject {
    tags?: string[];
    summary?: string;
    description?: string;
    externalDocs?: ExternalDocumentationObject;
    operationId?: string;
    parameters?: (ParameterObject | ReferenceObject)[];
    requestBody?: RequestBodyObject | ReferenceObject;
    responses: ResponsesObject;
    callbacks?: { [callback: string]: CallbackObject | ReferenceObject };
    deprecated?: boolean;
    security?: SecurityRequirementObject[];
    servers?: ServerObject[];
}

export type ParameterIn = 'query' | 'header' | 'path';

export interface ParameterObject {
    name: string;
    in: ParameterIn;
    description?: string;
    required?: boolean;
    deprecated?: boolean;
    allowEmptyValue?: boolean;
    style?: string;
    explode?: boolean;
    allowReserved?: boolean;
    schema?: SchemaObject | ReferenceObject;
    example?: any;
    examples?: { [media: string]: ExampleObject | ReferenceObject };
}

export interface RequestBodyObject {
    description?: string;
    content: { [media: string]: MediaTypeObject };
    required?: boolean;
}

export interface MediaTypeObject {
    schema?: SchemaObject | ReferenceObject;
    example?: any;
    examples?: { [media: string]: ExampleObject | ReferenceObject };
    encoding?: { [key: string]: EncodingObject };
}

export interface ResponsesObject {
    default?: ResponseObject | ReferenceObject;
    [statusCode: string]: ResponseObject | ReferenceObject;
}

export interface ResponseObject {
    description: string;
    headers?: { [header: string]: HeaderObject | ReferenceObject };
    content?: { [media: string]: MediaTypeObject };
    links?: { [link: string]: LinkObject | ReferenceObject };
}

export interface SchemaObject {
    title?: string;
    multipleOf?: number;
    maximum?: number;
    exclusiveMaximum?: boolean;
    minimum?: number;
    exclusiveMinimum?: boolean;
    maxLength?: number;
    minLength?: number;
    pattern?: string;
    maxItems?: number;
    minItems?: number;
    uniqueItems?: boolean;
    maxProperties?: number;
    minProperties?: number;
    required?: string[];
    enum?: any[];
    type?: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
    allOf?: (SchemaObject | ReferenceObject)[];
    oneOf?: (SchemaObject | ReferenceObject)[];
    anyOf?: (SchemaObject | ReferenceObject)[];
    not?: SchemaObject | ReferenceObject;
    items?: SchemaObject | ReferenceObject;
    properties?: { [key: string]: SchemaObject | ReferenceObject };
    additionalProperties?: boolean | SchemaObject | ReferenceObject;
    description?: string;
    format?: string;
    default?: any;
    nullable?: boolean;
    discriminator?: DiscriminatorObject;
    readOnly?: boolean;
    writeOnly?: boolean;
    xml?: XMLObject;
    externalDocs?: ExternalDocumentationObject;
    example?: any;
    deprecated?: boolean;
}

export interface ComponentsObject {
    schemas?: { [key: string]: SchemaObject | ReferenceObject };
    responses?: { [key: string]: ResponseObject | ReferenceObject };
    parameters?: { [key: string]: ParameterObject | ReferenceObject };
    examples?: { [key: string]: ExampleObject | ReferenceObject };
    requestBodies?: { [key: string]: RequestBodyObject | ReferenceObject };
    headers?: { [key:string]: HeaderObject | ReferenceObject };
    securitySchemes?: { [key: string]: SecuritySchemeObject | ReferenceObject };
    links?: { [key: string]: LinkObject | ReferenceObject };
    callbacks?: { [key: string]: CallbackObject | ReferenceObject };
}

export interface TagObject {
    name: string;
    description?: string;
    externalDocs?: ExternalDocumentationObject;
}

export interface ExternalDocumentationObject {
    description?: string;
    url: string;
}

export interface ReferenceObject {
    $ref: string;
}

export interface ExampleObject {
    summary?: string;
    description?: string;
    value?: any;
    externalValue?: string;
}

export interface EncodingObject {
    contentType?: string;
    headers?: { [key: string]: HeaderObject | ReferenceObject };
    style?: string;
    explode?: boolean;
    allowReserved?: boolean;
}

export interface HeaderObject extends Omit<ParameterObject, 'name' | 'in'> {}

export interface CallbackObject {
    [expression: string]: PathItemObject;
}

export interface LinkObject {
    operationRef?: string;
    operationId?: string;
    parameters?: { [key: string]: any };
    requestBody?: any;
    description?: string;
    server?: ServerObject;
}

export interface SecurityRequirementObject {
    [name: string]: string[];
}

export interface SecuritySchemeObject {
    type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
    description?: string;
    name?: string; 
    in?: 'query' | 'header'; 
    scheme?: string; 
    bearerFormat?: string; 
    flows?: OAuthFlowsObject; 
    openIdConnectUrl?: string; 
}

export interface OAuthFlowsObject {
    implicit?: OAuthFlowObject;
    password?: OAuthFlowObject;
    clientCredentials?: OAuthFlowObject;
    authorizationCode?: OAuthFlowObject;
}

export interface OAuthFlowObject {
    authorizationUrl?: string;
    tokenUrl?: string;
    refreshUrl?: string;
    scopes: { [scope: string]: string };
}

export interface DiscriminatorObject {
    propertyName: string;
    mapping?: { [key: string]: string };
}

export interface XMLObject {
    name?: string;
    namespace?: string;
    prefix?: string;
    attribute?: boolean;
    wrapped?: boolean;
}

export type Path = (string | number)[];
