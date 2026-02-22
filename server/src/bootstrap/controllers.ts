import { MovieController } from '../controllers/movie.controller';
import { AuthController } from '../controllers/auth.controller';
import { MovieService } from '../services/movie.service';
import { AuthService } from '../services/auth.service';
import { MovieRepository } from '../repositories/movie.repository';
import { UserRepository } from '../repositories/user.repository';
import { PasswordService } from '../services/password.service';
import { JWTService } from '../services/jwt.service';
import { scraperEngine } from '../services/scraper/ScraperEngine';
import { OAuthController } from '../controllers/oauth.controller';
import { OAuthService } from '../services/oauth.service';
import { configurePassport } from '../config/passport';
import { UserController } from '../controllers/user.controller';
import { UserService } from '../services/user.service';
import { MovieInteractionController } from '../controllers/movieInteraction.controller';
import { MovieInteractionService } from '../services/movieInteraction.service';
import { MovieInteractionRepository } from '../repositories/movieInteraction.repository';
import { EmailService } from '../services/email.service';
import { VerificationEmailRepository } from '../repositories/verificationEmail.repository';
import { CommentRepository } from '../repositories/comment.repository';
import { CommentService } from '../services/comment.service';
import { CommentController } from '../controllers/comment.controller';
import { SubtitleService } from '../services/SubtitleService';
import { StreamingService } from '../services/streaming.service';
import { StreamingController } from '../controllers/streaming.controller';

export const createControllers = () => {
  // Shared repositories
  const userRepository = new UserRepository();
  const passwordService = new PasswordService();

  // MovieInteraction dependencies
  const movieInteractionRepository = new MovieInteractionRepository();
  const movieInteractionService = new MovieInteractionService(movieInteractionRepository);
  const movieInteractionController = new MovieInteractionController(movieInteractionService);

  // Movie dependencies
  const movieRepository = new MovieRepository();
  const movieService = new MovieService(movieRepository, scraperEngine, movieInteractionRepository);
  const movieController = new MovieController(movieService);

  // Auth dependencies
  const jwtService = new JWTService(userRepository);
  const verificationEmailRepository = new VerificationEmailRepository();
  const emailService = new EmailService(verificationEmailRepository);
  const authService = new AuthService(userRepository, passwordService, emailService);
  const authController = new AuthController(authService, jwtService);

  // OAuth dependencies
  const oauthService = new OAuthService(userRepository, passwordService);
  const oauthController = new OAuthController(jwtService);

  // Configure Passport with injected dependencies
  configurePassport(oauthService);

  // accounts dependencies
  const userService = new UserService(userRepository, passwordService);
  const userController = new UserController(userService);

  // comments dependencies
  const commentRepository = new CommentRepository();
  const commentService = new CommentService(commentRepository, movieRepository, movieService);
  const commentController = new CommentController(commentService);

  // Streaming dependencies
  const subtitleService = new SubtitleService(movieRepository);
  const streamingService = new StreamingService(movieRepository, subtitleService);
  const streamingController = new StreamingController(streamingService);

  return {
    movieController,
    authController,
    oauthController,
    userController,
    movieInteractionController,
    commentController,
    streamingController,
    streamingService,
  };
};
