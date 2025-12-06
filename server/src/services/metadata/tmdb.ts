import axios from 'axios';
import { env } from '../../config/env';

const TMDB_KEY = env.TMDB_API_KEY;
const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p';

export async function getMetadata(imdbId: string) {
  // find is better than search because it guarantees the exact match
  const url = `${TMDB_BASE}/find/${imdbId}?api_key=${TMDB_KEY}&external_source=imdb_id`;

  const { data } = await axios.get(url);
  const tmdbMovie = data.movie_results[0];

  if (!tmdbMovie) return null;

  // fetch Details and Trailer
  const detailUrl = `${TMDB_BASE}/movie/${tmdbMovie.id}?api_key=${TMDB_KEY}&append_to_response=videos`;
  const detailRes = await axios.get(detailUrl);
  const details = detailRes.data;

  const youtubeTrailer = details.videos.results.find(
    (v: any) => v.site === 'YouTube' && v.type === 'Trailer',
  );
  const trailerUrl = youtubeTrailer ? `https://www.youtube.com/watch?v=${youtubeTrailer.key}` : '';

  return {
    title: details.title,
    year: parseInt(details.release_date.split('-')[0]),
    synopsis: details.overview,
    duration: details.runtime,
    rating: details.vote_average,
    genres: details.genres.map((g: any) => g.name),
    language: details.original_language,
    images: {
      poster: `${IMAGE_BASE}/w500${details.poster_path}`,
      backdrop: `${IMAGE_BASE}/original${details.backdrop_path}`,
      thumbnail: `${IMAGE_BASE}/w200${details.poster_path}`,
    },
    trailer: trailerUrl,
  };
}
