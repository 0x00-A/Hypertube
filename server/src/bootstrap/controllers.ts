import { MovieController } from '../controllers/movie.controller';
import { AuthController } from '../controllers/auth.controller';
import { MovieService } from '../services/movie.service';
import { AuthService } from '../services/auth.service';
import { MovieRepository } from '../repositories/movie.repository';
import { UserRepository } from '../repositories/user.repository';
import { PasswordService } from '../services/password.service';
import { JWTService } from '../services/jwt.service';

export const createControllers = () => {
  // Movie dependencies
  const movieRepository = new MovieRepository();
  const movieService = new MovieService(movieRepository);
  const movieController = new MovieController(movieService);

  // Auth dependencies
  const userRepository = new UserRepository();
  const passwordService = new PasswordService();
  const jwtService = new JWTService();
  const authService = new AuthService(userRepository, passwordService, jwtService);
  const authController = new AuthController(authService);

  return { movieController, authController };
};
