import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import { router as moviesRouter } from './routes/v1/movies.routes';
import { router as usersRouter } from './routes/v1/users.routes';
import { router as commentsRouter } from './routes/v1/comments.routes';
import { createAuthRoutes } from './routes/v1/auth.routes';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFound';
import { requestLogger } from './middleware/requestLogger';
import { env } from './config/env';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './docs/swagger';
import { dbHealth } from './config/database';
// Contrellers
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
// Services
import { PasswordService } from './services/password.service';
// Repositories
import { UserRepository } from './repositories/user.repository';


export const createApp = () => {
  const app = express();
  app.disable('x-powered-by');

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Basic rate limit placeholder (adjust for write/auth routes later)
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

  // Docs endpoints
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));

  // Versioned domain routes
  app.use('/v1/movies', moviesRouter);
  app.use('/v1/users', usersRouter);
  app.use('/v1/comments', commentsRouter);

  // Health check
  app.get('/health', (_req, res) => {
    const dbStatus = dbHealth();
    res.json({ status: 'ok', db: dbStatus });
  });

  // authentication and authorization routes
  const authService = new AuthService(new UserRepository(), new PasswordService());
  const authController = new AuthController(authService);
  app.use('/v1/auth', createAuthRoutes(authController));

  // accounts routes
  app.use('/v1/accounts', usersRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
