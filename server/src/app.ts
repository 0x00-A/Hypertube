import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import { createMovieRouter } from './routes/v1/movies.routes';
// import { router as commentsRouter } from './routes/v1/comments.routes';
import { createAuthRoutes } from './routes/v1/auth.routes';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFound';
import { requestLogger } from './middleware/requestLogger';
import { env } from './config/env';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './docs/swagger';
import { dbHealth } from './config/database';
import { createControllers } from './bootstrap/controllers';
import { auth } from './middleware/auth';

export const createApp = () => {
  const app = express();
  app.disable('x-powered-by');

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(auth);

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 100,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
    }),
  );

  if (env.isDev) {
    app.use(requestLogger);
  }

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));

  // Initialize controllers
  const { movieController, authController } = createControllers();

  app.use('/v1/movies', createMovieRouter(movieController));
  // app.use('/v1/comments', commentsRouter);
  app.use('/v1/auth', createAuthRoutes(authController));

  app.get('/health', (_req, res) => {
    const dbStatus = dbHealth();
    res.json({ status: 'ok', db: dbStatus });
  });

  // accounts routes
  // app.use('/v1/accounts', usersRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
