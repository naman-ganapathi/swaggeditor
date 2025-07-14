
export const defaultSpec = `
openapi: 3.0.0
info:
  title: API Heading
  version: 1.0.0
  description: Add your API description here.
servers:
  - url: https://eu.api.capillarytech.com
    description: EU Cluster
  - url: https://us.api.capillarytech.com
    description: US Cluster
  - url: https://in.api.capillarytech.com
    description: India Cluster
  - url: https://apac.api.capillarytech.com
    description: APAC Cluster
paths:
  /api/endpoint:
    get:
      summary: API Endpoint Summary
      operationId: listPets
      tags:
        - pets
      parameters:
        - name: limit
          in: query
          description: How many items to return at one time (max 100)
          required: false
          schema:
            type: integer
            maximum: 100
            format: int32
      responses:
        '200':
          description: A paged array of pets
          headers:
            x-next:
              description: A link to the next page of responses
              schema:
                type: string
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Pets'
components:
  securitySchemes:
    BasicAuth:
      type: http
      scheme: basic
      description: HTTP Basic Authentication
  schemas:
    Pet:
      type: object
      required:
        - id
        - name
      properties:
        id:
          type: integer
          format: int64
        name:
          type: string
        tag:
          type: string
    Pets:
      type: array
      items:
        $ref: '#/components/schemas/Pet'
`;