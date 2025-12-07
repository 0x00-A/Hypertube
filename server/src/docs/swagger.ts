import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'Hypertube API',
      version: '0.1.0',
      description: 'API for Hypertube streaming platform',
    },
    security: [{ bearerAuth: [] }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Auth: {
          type: 'object',
          properties: {
            token: { type: 'string' },
          },
        },
        Movie: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            year: { type: 'integer' },
            rating: { type: 'number' },
            coverUrl: { type: 'string' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
          },
        },
        Comment: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            movieId: { type: 'string' },
            content: { type: 'string' },
          },
        },
        PaginatedMovie: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { $ref: '#/components/schemas/Movie' } },
            page: { type: 'integer', minimum: 1 },
            limit: { type: 'integer', minimum: 1 },
            total: { type: 'integer', minimum: 0 },
            totalPages: { type: 'integer', minimum: 0 },
          },
        },
        PaginatedUser: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { $ref: '#/components/schemas/User' } },
            page: { type: 'integer', minimum: 1 },
            limit: { type: 'integer', minimum: 1 },
            total: { type: 'integer', minimum: 0 },
            totalPages: { type: 'integer', minimum: 0 },
          },
        },
        PaginatedComment: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { $ref: '#/components/schemas/Comment' } },
            page: { type: 'integer', minimum: 1 },
            limit: { type: 'integer', minimum: 1 },
            total: { type: 'integer', minimum: 0 },
            totalPages: { type: 'integer', minimum: 0 },
          },
        },
      },
    },
  },
  // Load both YAML file and JSDoc annotations from route files
  apis: [
    path.join(__dirname, 'swagger.yaml'),
    'src/routes/v1/*.routes.ts',
    'src/controllers/*.controller.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
