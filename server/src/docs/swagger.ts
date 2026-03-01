import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

const isProd = __dirname.includes('dist');
const yamlDir = path.join(process.cwd(), 'src/docs');
const sourceDir = isProd ? 'dist/src' : 'src';

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
    path.join(yamlDir, 'swagger.yaml'),
    path.join(yamlDir, 'swagger.curated.yaml'),
    path.join(yamlDir, 'swagger.interactions.yaml'),
    path.join(yamlDir, 'swagger.comments.yaml'),
    path.join(yamlDir, 'swagger.streaming.yaml'),
    `${sourceDir}/routes/v1/*.routes.{ts,js}`,
    `${sourceDir}/controllers/*.controller.{ts,js}`,
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
