import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import { createMovieRouter } from './routes/v1/movies.routes';
import { createAuthRoutes } from './routes/v1/auth.routes';
import { createMovieInteractionRouter } from './routes/v1/movieInteractions.routes';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFound';
import { requestLogger } from './middleware/requestLogger';
import { auth } from './middleware/auth';
import { env } from './config/env';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './docs/swagger';
import { dbHealth } from './config/database';
import { createControllers } from './bootstrap/controllers';
import { createOAuthRoutes } from './routes/v1/oauth.routes';
import { passport } from './config/passport';
import { createUserRoutes } from './routes/v1/users.routes';
import { createCommentRouter } from './routes/v1/comment.routes';

export const createApp = () => {
  const app = express();
  app.disable('x-powered-by');

  const corsOptions = {
    origin:
      env.NODE_ENV === 'production'
        ? env.CLIENT_URL
        : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(cors(corsOptions));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(passport.initialize());

  // Disable rate limiting in test environment to prevent 429 errors
  if (env.NODE_ENV !== 'test') {
    app.use(
      rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 100,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
      }),
    );
  }

  if (env.isDev) {
    app.use(requestLogger);
  }

  // Public routes (no auth required)
  app.get('/health', (_req, res) => {
    const dbStatus = dbHealth();
    res.json({ status: 'ok', db: dbStatus });
  });
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));

  // Initialize controllers
  const {
    movieController,
    authController,
    oauthController,
    userController,
    movieInteractionController,
    commentController,
  } = createControllers();
  app.use('/api/v1/auth', createAuthRoutes(authController));
  app.use('/api/v1/oauth', createOAuthRoutes(oauthController));
  app.use('/api/v1/movies', createMovieRouter(movieController));
  app.use('/api/v1/users', createUserRoutes(userController));
  app.use('/api/v1/interactions', createMovieInteractionRouter(movieInteractionController));
  app.use('/api/v1/comments', createCommentRouter(commentController));

  // Test endpoint for auth middleware (protected)
  app.get('/api/v1/protected', auth, (_req, res) => {
    res.json({ status: 'success', message: 'Protected route accessed', data: { user: _req.user } });
  });

  // Other routes (not protected by default)

  // accounts routes
  // app.use('/v1/accounts', usersRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
