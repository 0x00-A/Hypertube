import { ScraperEngine } from '../../../src/services/scraper/ScraperEngine';
import { IMovie, IScrapedMovie, ITorrent } from '../../../src/interfaces/movie.interface';

jest.mock('../../../src/services/metadata/tmdb', () => ({
  getMetadata: jest.fn(),
}));

import { getMetadata } from '../../../src/services/metadata/tmdb';
import { YtsProvider } from '../../../src/services/scraper/providers/YtsProvider';

describe('ScraperEngine (unit)', () => {
  let engine: ScraperEngine;
  let ytsProvider: YtsProvider;

  beforeEach(() => {
    ytsProvider = new YtsProvider();
    engine = new ScraperEngine([ytsProvider]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates a new movie when not existing and metadata is available', async () => {
    // Arrange
    const partial: IScrapedMovie = {
      imdbId: 'tt1111111',
      title: 'Partial Title',
      year: 2023,
      slug: 'partial-title',
      rating: 7.5,
      torrents: [
        {
          url: 'magnet:?xt=urn:btih:test',
          hash: 'hash1',
          quality: '1080p',
          type: 'mp4',
          videoCodec: 'x264',
          seeds: 10,
          peers: 2,
          size: '1 GB',
          sizeBytes: 1073741824,
          provider: 'YTS',
        },
      ],
    };

    // Mock repository to return null for findByImdbId and spy on create
    const mockCreate = jest.fn();
    const mockFindByImdbId = jest.fn().mockResolvedValue(null);

    (engine as any)._movieRepository = {
      findByImdbId: mockFindByImdbId,
      create: mockCreate,
    };

    // Mock metadata
    (getMetadata as jest.Mock).mockResolvedValue({
      title: 'Full Title',
      rating: 8.2,
      duration: 120,
      synopsis: 'Full synopsis',
      images: { thumbnail: 't', poster: 'p', backdrop: 'b' },
      genres: ['Action'],
      language: 'en',
      lastUpdated: new Date(),
    });

    // Act
    await engine.fillMetadataAndUpsertMovie(partial);

    // Assert
    expect(mockFindByImdbId).toHaveBeenCalledWith('tt1111111');
    expect(getMetadata).toHaveBeenCalledWith('tt1111111');
    expect(mockCreate).toHaveBeenCalled();

    const createdArg = mockCreate.mock.calls[0][0];
    expect(createdArg).toMatchObject({
      imdbId: 'tt1111111',
      title: 'Full Title',
      torrents: expect.any(Array),
    });
  });

  it('updates existing movie by adding new torrents and saves it', async () => {
    // Arrange
    const partial: IScrapedMovie = {
      imdbId: 'tt2222222',
      title: 'Existing Movie',
      year: 2020,
      slug: 'existing-movie',
      rating: 6.5,
      torrents: [
        {
          url: 'magnet:?xt=urn:btih:newhash',
          hash: 'newhash',
          quality: '720p',
          type: 'mp4',
          videoCodec: 'x264',
          seeds: 5,
          peers: 1,
          size: '700 MB',
          sizeBytes: 734003200,
          provider: 'Popcorn',
        },
      ],
    };

    const existingMovie: IMovie & { save: jest.Mock } = {
      imdbId: 'tt2222222',
      tmdbId: 2222222,
      title: 'Existing Movie',
      year: 2020,
      rating: undefined,
      duration: undefined,
      synopsis: undefined,
      genres: undefined,
      originalLanguage: undefined,
      trailer: undefined,
      images: { thumbnail: '', poster: '', backdrop: '' },
      torrents: [
        {
          url: 'magnet:?xt=urn:btih:oldhash',
          hash: 'oldhash',
          quality: '1080p',
          type: 'mp4',
          videoCodec: 'x264',
          seeds: 50,
          peers: 10,
          size: '1.5 GB',
          sizeBytes: 1610612736,
          provider: 'YTS',
        },
      ],
      downloadStatus: 'not_downloaded',
      lastWatched: undefined,
      localPath: undefined,
      lastUpdated: new Date('2020-01-01'),
      save: jest.fn().mockResolvedValue(true),
    };

    const mockFindByImdbId = jest.fn().mockResolvedValue(existingMovie);
    (engine as any)._movieRepository = {
      findByImdbId: mockFindByImdbId,
    };

    // Act
    await engine.fillMetadataAndUpsertMovie(partial);

    // Assert
    expect(mockFindByImdbId).toHaveBeenCalledWith('tt2222222');
    expect((existingMovie.save as jest.Mock).mock.calls.length).toBe(1);
    expect(existingMovie.torrents.some((t: ITorrent) => t.hash === 'newhash')).toBe(true);
  });

  it('scrapePage invokes all providers and calls fillMetadataAndUpsertMovie for each result', async () => {
    // Arrange
    const mockProviderA = {
      scrape: jest.fn().mockResolvedValue([{ imdbId: 'ttA', title: 'A', torrents: [] }]),
    };
    const mockProviderB = {
      scrape: jest.fn().mockResolvedValue([{ imdbId: 'ttB', title: 'B', torrents: [] }]),
    };

    (engine as any)._providers = [mockProviderA, mockProviderB];

    const spyFill = jest
      .spyOn(engine as any, 'fillMetadataAndUpsertMovie')
      .mockResolvedValue(undefined);

    // Mock repo to avoid DB calls
    (engine as any)._movieRepository = {
      findByImdbId: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(undefined),
    };

    // Act
    await engine.scrapePage(1);

    // Assert
    expect(mockProviderA.scrape).toHaveBeenCalledWith(1);
    expect(mockProviderB.scrape).toHaveBeenCalledWith(1);
    expect(spyFill).toHaveBeenCalledTimes(2);
  });
});
