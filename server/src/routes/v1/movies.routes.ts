import { Router } from 'express';
import { MovieController } from '../../controllers/movie.controller';
import { validate } from '../../middleware/validate';
import { MovieListQuerySchema, MovieIdParamSchema } from '../../validators/movie.schema';

export const createMovieRouter = (movieController: MovieController): Router => {
  const router = Router();

  /**
   * @openapi
   * /v1/movies:
   *   get:
   *     summary: List movies (placeholder)
   *     parameters:
   *       - in: query
   *         name: page
   *         schema: { type: integer }
   *       - in: query
   *         name: limit
   *         schema: { type: integer }
   *     responses:
   *       200:
   *         description: Paginated movies
   */
  router.get('/', validate(MovieListQuerySchema), movieController.listMovies);

  /**
   * @openapi
   * /v1/movies/{id}:
   *   get:
   *     summary: Get a movie (placeholder)
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: Movie found
   *       404:
   *         description: Not found
   */
  router.get('/:id', validate(MovieIdParamSchema), movieController.getMovie);

  return router;
};
