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
    },
  },
  apis: [
    path.join(__dirname, 'swagger.yaml'),
    path.join(__dirname, 'swagger.curated.yaml'),
    path.join(__dirname, 'swagger.interactions.yaml'),
    path.join(__dirname, 'swagger.comments.yaml'),
    path.join(__dirname, 'swagger.streaming.yaml'),
    'src/routes/v1/*.routes.ts',
    'src/controllers/*.controller.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
