import mongoose from 'mongoose';
import { ScraperEngine } from '../../src/services/scraper/ScraperEngine';
import { MovieRepository } from '../../src/repositories/movie.repository';
import { IScrapedMovie, IMovie } from '../../src/interfaces/movie.interface';
import { BaseProvider } from '../../src/services/scraper/providers/BaseProvider';
import { YtsProvider } from '../../src/services/scraper/providers/YtsProvider';

// Mock providers for testing
class MockYtsProvider extends BaseProvider {
  constructor() {
    super('MockYTS', 'http://mock-yts.com');
  }

  async scrape(page: number): Promise<IScrapedMovie[]> {
    if (page !== 1) return [];

    return [
      {
        imdbId: 'tt0111161',
        title: 'The Shawshank Redemption',
        year: 1994,
        slug: 'the-shawshank-redemption-1994',
        rating: 9.3,
        torrents: [
          {
            url: 'magnet:?xt=urn:btih:mock1',
            hash: 'mockhash1',
            quality: '1080p',
            type: 'mp4',
            videoCodec: 'x264',
            seeds: 150,
            peers: 20,
            size: '2.5 GB',
            sizeBytes: 2684354560,
            provider: 'MockYTS',
          },
          {
            url: 'magnet:?xt=urn:btih:mock2',
            hash: 'mockhash2',
            quality: '720p',
            type: 'mp4',
            videoCodec: 'x264',
            seeds: 80,
            peers: 15,
            size: '1.2 GB',
            sizeBytes: 1288490188,
            provider: 'MockYTS',
          },
        ],
      },
      {
        imdbId: 'tt0468569',
        title: 'The Dark Knight',
        year: 2008,
        slug: 'the-dark-knight-2008',
        rating: 9.0,
        torrents: [
          {
            url: 'magnet:?xt=urn:btih:mock3',
            hash: 'mockhash3',
            quality: '1080p',
            type: 'mp4',
            videoCodec: 'x264',
            seeds: 200,
            peers: 30,
            size: '2.8 GB',
            sizeBytes: 3006477107,
            provider: 'MockYTS',
          },
        ],
      },
    ];
  }

  // Implement the abstract search method to satisfy BaseProvider
  async search(
    _filters: Partial<Record<string, unknown>>, // Accept any filter shape for test
    page: number = 1,
  ): Promise<IScrapedMovie[]> {
    // For test purposes, just return the same as scrape for page 1, or empty for others
    return this.scrape(page);
  }
}

// Mock TMDB metadata service - conditionally based on RUN_SCRAPER_INTEGRATION
jest.mock('../../src/services/metadata/tmdb', () => {
  const useRealProviders = process.env.RUN_SCRAPER_INTEGRATION === 'true';

  if (useRealProviders) {
    // Use actual implementation for real provider tests
    return jest.requireActual('../../src/services/metadata/tmdb');
  }

  // Use mock for mock provider tests
  return {
    getMetadata: jest.fn().mockImplementation((imdbId: string) => {
      const metadata: Record<string, unknown> = {
        tt0111161: {
          title: 'The Shawshank Redemption',
          tmdbId: 278,
          year: 1994,
          synopsis:
            'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.',
          duration: 142,
          rating: 9.3,
          genres: ['Drama'],
          language: 'en',
          images: {
            poster: 'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
            backdrop: 'https://image.tmdb.org/t/p/original/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg',
            thumbnail: 'https://image.tmdb.org/t/p/w200/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
          },
          trailer: 'https://www.youtube.com/watch?v=6hB3S9bIaco',
        },
        tt0468569: {
          title: 'The Dark Knight',
          tmdbId: 155,
          year: 2008,
          synopsis:
            'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
          duration: 152,
          rating: 9.0,
          genres: ['Action', 'Crime', 'Drama'],
          language: 'en',
          images: {
            poster: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
            backdrop: 'https://image.tmdb.org/t/p/original/hqkIcbrOHL86UncnHIsHVcVmzue.jpg',
            thumbnail: 'https://image.tmdb.org/t/p/w200/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
          },
          trailer: 'https://www.youtube.com/watch?v=EXeTwQWrcwY',
        },
      };
      return Promise.resolve(metadata[imdbId] || null);
    }),
  };
});

// Mock logger to suppress logs during tests
jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('ScraperEngine Integration Test', () => {
  let engine: ScraperEngine;
  let movieRepository: MovieRepository;
  let providers: BaseProvider[];

  const useRealProviders = process.env.RUN_SCRAPER_INTEGRATION === 'true';

  beforeEach(async () => {
    // Clear the database before each test
    await mongoose.connection.dropDatabase();

    // Initialize engine and repository
    if (!useRealProviders) {
      providers = [new MockYtsProvider()];
    } else {
      providers = [new YtsProvider()];
    }

    engine = new ScraperEngine(providers);
    movieRepository = new MovieRepository();
  });

  describe('searchQuery - End-to-End', () => {
    it('should search and upsert movies to MongoDB using the search method', async () => {
      if (!useRealProviders) {
        // Call searchQuery with a search term
        await engine.searchQuery(
          { page: 1, limit: 10, sortBy: 'lastUpdated', sortOrder: 'desc' },
          { search: 'Shawshank' },
        );

        // Verify movies were saved to the database
        const response = await movieRepository.findAll(
          {
            page: 1,
            limit: 10,
            sortBy: 'lastUpdated',
            sortOrder: 'desc',
          },
          {},
          [],
        );
        expect(response.data).toBeDefined();
        expect(response.data!.length).toBe(2);
        const shawshank = response.data!.find((m: IMovie) => m.imdbId === 'tt0111161');
        expect(shawshank).toBeDefined();
        expect(shawshank!.title).toBe('The Shawshank Redemption');
      }
    });
  });

  describe('scrapePage - End-to-End', () => {
    it('should scrape page 1, fetch metadata, and save movies to MongoDB', async () => {
      // Execute the scrape
      await engine.scrapePage(1);

      // Verify movies were saved to the database
      const response = await movieRepository.findAll(
        {
          page: 1,
          limit: 10,
          sortBy: 'lastUpdated',
          sortOrder: 'desc',
        },
        {},
        [],
      );

      if (useRealProviders) {
        // When using real providers, we just verify that movies were scraped
        expect(response.data).toBeDefined();
        expect(response.data!.length).toBeGreaterThan(0);
        expect(response.pagination.total).toBeGreaterThan(0);

        // Verify structure of first movie
        const firstMovie = response.data![0];
        expect(firstMovie.imdbId).toBeDefined();
        expect(firstMovie.title).toBeDefined();
        expect(firstMovie.year).toBeGreaterThan(1900);
        expect(firstMovie.torrents.length).toBeGreaterThan(0);
        expect(firstMovie.images).toBeDefined();
        expect(firstMovie.genres).toBeDefined();
      } else {
        // When using mock providers, we verify exact data
        expect(response.data).toBeDefined();
        expect(response.data!.length).toBe(2);
        expect(response.pagination.total).toBe(2);

        // Find the movies by IMDb ID
        const shawshank = response.data!.find((m: IMovie) => m.imdbId === 'tt0111161');
        const darkKnight = response.data!.find((m: IMovie) => m.imdbId === 'tt0468569');

        // Verify Shawshank Redemption
        expect(shawshank).toBeDefined();
        expect(shawshank!.title).toBe('The Shawshank Redemption');
        expect(shawshank!.year).toBe(1994);
        expect(shawshank!.rating).toBe(9.3);
        expect(shawshank!.duration).toBe(142);
        expect(shawshank!.genres).toContain('Drama');
        expect(shawshank!.torrents).toHaveLength(2);
        expect(shawshank!.torrents[0].quality).toBe('1080p');
        expect(shawshank!.torrents[1].quality).toBe('720p');

        // Verify Dark Knight
        expect(darkKnight).toBeDefined();
        expect(darkKnight!.title).toBe('The Dark Knight');
        expect(darkKnight!.year).toBe(2008);
        expect(darkKnight!.rating).toBe(9.0);
        expect(darkKnight!.duration).toBe(152);
        expect(darkKnight!.genres).toEqual(['Action', 'Crime', 'Drama']);
        expect(darkKnight!.torrents).toHaveLength(1);
      }
    }, 30000); // 30 second timeout for real API calls

    it('should update existing movie with new torrents on subsequent scrapes', async () => {
      if (!useRealProviders) {
        // First scrape
        await engine.scrapePage(1);

        // Get initial movie
        const initialResponse = await movieRepository.findAll(
          {
            page: 1,
            limit: 10,
            sortBy: 'lastUpdated',
            sortOrder: 'desc',
          },
          {},
          [],
        );
        const initialMovie = initialResponse.data!.find((m: IMovie) => m.imdbId === 'tt0111161');
        const initialCount = initialMovie!.torrents.length;

        // Modify the mock to add a new torrent to the Shawshank movie
        const mockProvider = (engine as any)._providers[0] as MockYtsProvider;
        const originalScrape = mockProvider.scrape.bind(mockProvider);

        mockProvider.scrape = jest.fn().mockImplementation(async (page: number) => {
          const movies = await originalScrape(page);
          if (movies.length > 0) {
            // Find the Shawshank movie and add a new torrent
            const shawshankMovie = movies.find((m) => m.imdbId === 'tt0111161');
            if (shawshankMovie) {
              shawshankMovie.torrents.push({
                url: 'magnet:?xt=urn:btih:mock4',
                hash: 'mockhash4',
                quality: '2160p',
                type: 'mp4',
                videoCodec: 'x265',
                seeds: 300,
                peers: 50,
                size: '5.0 GB',
                sizeBytes: 5368709120,
                provider: 'MockYTS',
              });
            }
          }
          return movies;
        });

        // Second scrape with new torrent
        await engine.scrapePage(1);

        // Verify the torrent was added to Shawshank only
        const updatedResponse = await movieRepository.findAll(
          {
            page: 1,
            limit: 10,
            sortBy: 'lastUpdated',
            sortOrder: 'desc',
          },
          {},
          [],
        );
        const updatedMovie = updatedResponse.data!.find((m: IMovie) => m.imdbId === 'tt0111161');
        const darkKnightMovie = updatedResponse.data!.find((m: IMovie) => m.imdbId === 'tt0468569');

        expect(updatedMovie!.torrents.length).toBe(initialCount + 1);
        expect(updatedMovie!.torrents.some((t: { quality: string }) => t.quality === '2160p')).toBe(
          true,
        );

        // Dark Knight should still have only 1 torrent
        expect(darkKnightMovie!.torrents.length).toBe(1);
      }
    }, 30000);

    it('should not duplicate torrents with same hash', async () => {
      if (!useRealProviders) {
        // First scrape
        await engine.scrapePage(1);

        // Second scrape (same data)
        await engine.scrapePage(1);

        // Verify no duplicates
        const response = await movieRepository.findAll(
          {
            page: 1,
            limit: 10,
            sortBy: 'lastUpdated',
            sortOrder: 'desc',
          },
          {},
          [],
        );
        const shawshank = response.data!.find((m: IMovie) => m.imdbId === 'tt0111161');

        expect(shawshank!.torrents.length).toBe(2); // Still 2, not 4
      }
    });

    it('should skip movies without valid IMDb ID', async () => {
      if (!useRealProviders) {
        // Modify mock to include invalid IMDb ID
        const mockProvider = (engine as any)._providers[0] as MockYtsProvider;
        mockProvider.scrape = jest.fn().mockResolvedValue([
          {
            imdbId: '', // Invalid
            title: 'Invalid Movie',
            year: 2023,
            slug: 'invalid-movie',
            rating: 5.0,
            torrents: [],
          } as IScrapedMovie,
        ]);

        await engine.scrapePage(1);

        // Verify no movies were saved
        const response = await movieRepository.findAll(
          {
            page: 1,
            limit: 10,
            sortBy: 'lastUpdated',
            sortOrder: 'desc',
          },
          {},
          [],
        );
        expect(response.pagination.total).toBe(0);
      }
    });
  });

  describe('MongoDB Integration', () => {
    it('should properly save and retrieve movie data', async () => {
      if (!useRealProviders) {
        await engine.scrapePage(1);

        // Test direct repository access
        const movieByImdb = await movieRepository.findByImdbId('tt0111161');

        expect(movieByImdb).toBeDefined();
        expect(movieByImdb!.imdbId).toBe('tt0111161');
        expect(movieByImdb!.torrents).toHaveLength(2);
      }
    });

    it('should maintain unique IMDb IDs', async () => {
      if (!useRealProviders) {
        await engine.scrapePage(1);

        // Try to create duplicate - should update, not create new
        const movieCount = await mongoose.model('Movie').countDocuments();

        await engine.scrapePage(1);

        const newMovieCount = await mongoose.model('Movie').countDocuments();
        expect(newMovieCount).toBe(movieCount); // Same count, no duplicates
      }
    });
  });
});
