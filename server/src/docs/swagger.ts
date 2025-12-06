import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'Hypertube API',
      version: '0.1.0',
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
  apis: ['src/routes/v1/*.routes.ts', 'src/controllers/*.controller.ts'], // JSDoc annotations scanned here
};

export const swaggerSpec = swaggerJsdoc(options);
