import { MovieService } from '../../../src/services/movie.service';
import { ScraperEngine } from '../../../src/services/scraper/ScraperEngine';
import { getImdbIdFromTmdbId, getMetadata } from '../../../src/services/metadata/tmdb';
import { getYtsMovieDetailsByImdbId } from '../../../src/services/metadata/yts';

jest.mock('../../../src/services/metadata/tmdb');
jest.mock('../../../src/services/metadata/yts');

const mockMovieRepository = {
  findByImdbId: jest.fn(),
  findByTmdbId: jest.fn(),
  upsert: jest.fn(),
};
const mockScraperEngine = {} as ScraperEngine;
const mockMovieInteractionRepository = {
  findByUserAndMovies: jest.fn(),
};

describe('MovieService.completeMovieData', () => {
  let movieService: MovieService;

  beforeEach(() => {
    jest.clearAllMocks();
    movieService = new MovieService(
      mockMovieRepository as any,
      mockScraperEngine,
      mockMovieInteractionRepository as any,
    );
  });

  it('should return null if no imdbId is found', async () => {
    (getImdbIdFromTmdbId as jest.Mock).mockResolvedValue(null);
    const result = await movieService.completeMovieData(12345);
    expect(result).toBeNull();
  });

  it('should return existing movie if already in db', async () => {
    (getImdbIdFromTmdbId as jest.Mock).mockResolvedValue('tt1234567');
    mockMovieRepository.findByImdbId.mockResolvedValue({
      tmdbId: null,
      save: jest.fn().mockResolvedValue(undefined),
      toObject: () => ({ imdbId: 'tt1234567', tmdbId: 12345 }),
    });
    const result = await movieService.completeMovieData(12345);
    expect(result).toEqual({ imdbId: 'tt1234567', tmdbId: 12345 });
  });

  it('should return null if no metadata is found', async () => {
    (getImdbIdFromTmdbId as jest.Mock).mockResolvedValue('tt1234567');
    mockMovieRepository.findByImdbId.mockResolvedValue(null);
    (getMetadata as jest.Mock).mockResolvedValue(null);
    const result = await movieService.completeMovieData(12345);
    expect(result).toBeNull();
  });

  it('should upsert movie with YTS torrents if found', async () => {
    (getImdbIdFromTmdbId as jest.Mock).mockResolvedValue('tt1234567');
    mockMovieRepository.findByImdbId.mockResolvedValue(null);
    (getMetadata as jest.Mock).mockResolvedValue({
      title: 'Test Movie',
      year: 2020,
      rating: 8.5,
      duration: 120,
      synopsis: 'Test',
      genres: ['Action'],
      originalLanguage: 'en',
      trailer: 'url',
      images: { thumbnail: '', poster: '', backdrop: '' },
    });
    (getYtsMovieDetailsByImdbId as jest.Mock).mockResolvedValue({
      torrents: [
        {
          url: 'magnet:?xt=urn:btih:...',
          hash: 'hash',
          quality: '1080p',
          type: 'mp4',
          video_codec: 'x264',
          seeds: 100,
          peers: 10,
          size: '1.4 GB',
          size_bytes: 1500000000,
        },
      ],
    });
    mockMovieRepository.upsert.mockResolvedValue(undefined);
    const result = await movieService.completeMovieData(12345);
    expect(mockMovieRepository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        imdbId: 'tt1234567',
        tmdbId: 12345,
        title: 'Test Movie',
        torrents: expect.any(Array),
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        imdbId: 'tt1234567',
        tmdbId: 12345,
        title: 'Test Movie',
        torrents: expect.any(Array),
      }),
    );
  });
});
