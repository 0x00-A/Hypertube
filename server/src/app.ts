import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
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
import { createStreamingRouter } from './routes/v1/streaming.routes';

import { StreamingService } from './services/streaming.service';

export const createApp = (): {
  app: ReturnType<typeof express>;
  streamingService: StreamingService;
} => {
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
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());
  app.use(passport.initialize());

  // Static file serving (use process.cwd() instead of __dirname for production compatibility)
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  app.use('/api/subtitles', express.static(path.join(process.cwd(), 'public/subtitles')));

  // Global rate limit — loose, only blocks scripts hammering the API
  // Skipped in test environment to avoid 429 interference
  const isTest = env.NODE_ENV === 'test';

  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,       // 15 minutes
    limit: 500,                      // 500 req per IP per window — a browser user never hits this
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: () => isTest,
    message: { status: 'fail', message: 'Too many requests, please try again later.' },
  });

  // Stricter limiter on auth endpoints (login, register, password reset)
  // Prevents brute-force but still allows ~1 req/45s sustained
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,       // 15 minutes
    limit: 20,                       // 20 attempts per IP per window
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: () => isTest,
    message: { status: 'fail', message: 'Too many login attempts, please try again later.' },
  });

  app.use('/api/v1', globalLimiter);
  app.use('/api/v1/auth/login', authLimiter);
  app.use('/api/v1/auth/register', authLimiter);
  app.use('/api/v1/users/change-password', authLimiter);

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
    streamingController,
    streamingService: sService,
  } = createControllers();

  app.use('/api/v1/auth', createAuthRoutes(authController));
  app.use('/api/v1/oauth', createOAuthRoutes(oauthController));
  app.use('/api/v1/movies', createMovieRouter(movieController));
  app.use('/api/v1/users', createUserRoutes(userController));
  app.use('/api/v1/interactions', createMovieInteractionRouter(movieInteractionController));
  app.use('/api/v1/comments', createCommentRouter(commentController));
  app.use('/api/v1/stream', createStreamingRouter(streamingController));

  // Test endpoint for auth middleware (protected)
  app.get('/api/v1/protected', auth, (_req, res) => {
    res.json({ status: 'success', message: 'Protected route accessed', data: { user: _req.user } });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return { app, streamingService: sService };
};
