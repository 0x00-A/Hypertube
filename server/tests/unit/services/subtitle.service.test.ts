import * as path from 'path';
import * as fs from 'fs/promises';
import axios, { AxiosInstance } from 'axios';
import AdmZip from 'adm-zip';
import { gzipSync } from 'zlib';

// Ensure test files only run when enabled via env
const runTests = process.env.RUN_SUBTITLE_SERVICE_TESTS === 'true';
const describeIf = runTests ? describe : describe.skip;

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

import { MovieModel } from '../../../src/models/Movie';
import { MovieRepository } from '../../../src/repositories/movie.repository';
import { SubtitleService } from '../../../src/services/SubtitleService';

describeIf('SubtitleService (unit)', () => {
  const imdbId = 'tt0000001';
  const quality = '720p';
  const language = 'en';
  const srtContent = '1\n00:00:00,000 --> 00:00:01,000\nHello world\n';

  beforeAll(async () => {
    // Mock axios.create to return an object with get/post
    mockedAxios.create = jest.fn().mockReturnValue({
      get: jest.fn().mockResolvedValue({
        data: {
          data: [
            {
              attributes: {
                subtitle_id: 'sub1',
                language: language,
                files: [{ file_id: 111, file_name: `movie.${language}.srt` }],
              },
            },
          ],
        },
      }),
      post: jest.fn().mockImplementation((url: string) => {
        if (url === '/login') return Promise.resolve({ data: { token: 'test-token' } });
        if (url === '/download')
          return Promise.resolve({
            data: { link: 'http://example.com/movie.en.srt', file_name: `movie.${language}.srt` },
          });
        return Promise.resolve({ data: {} });
      }),
    } as unknown as AxiosInstance);

    // Mock axios.get for downloading the subtitle file (arraybuffer)
    mockedAxios.get = jest.fn().mockResolvedValue({ data: Buffer.from(srtContent, 'utf-8') });
  });

  afterAll(async () => {
    // cleanup created subtitle files
    const subtitlesDir = path.join(process.cwd(), 'public', 'subtitles', imdbId, language);
    try {
      await fs.rm(subtitlesDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  it('downloads, converts and saves subtitle and updates movie document', async () => {
    // create a movie in the in-memory DB
    const movie = await MovieModel.create({
      imdbId,
      tmdbId: 1,
      title: 'Test Movie',
      year: 2020,
      torrents: [
        {
          url: 'magnet:?xt=urn:btih:hash',
          hash: 'hash',
          quality: quality,
          type: 'mp4',
          videoCodec: 'x264',
          seeds: 10,
          peers: 2,
          size: '700 MB',
          sizeBytes: 700 * 1024 * 1024,
          provider: 'YTS',
        },
      ],
    });

    const repo = new MovieRepository();
    const service = new SubtitleService(repo);

    const torrent = movie.torrents[0];

    await service.ensureForMovie(imdbId, language, torrent as any);

    const updated = await repo.findByImdbId(imdbId);
    expect(updated).not.toBeNull();
    const subsForLang = updated!.subtitles?.get(language) || [];
    expect(subsForLang.length).toBeGreaterThan(0);

    const savedPath = path.join(
      process.cwd(),
      'public',
      'subtitles',
      imdbId,
      language,
      `${quality}.vtt`,
    );
    // ensure file exists
    const stat = await fs.stat(savedPath);
    expect(stat.isFile()).toBe(true);
  });

  it('extracts and converts subtitles from zip archives', async () => {
    const imdbId2 = 'tt0000002';
    const quality2 = '1080p';
    const srtContent2 = '1\n00:00:01,500 --> 00:00:03,000\nZipped subtitle test\n';

    // Create a zip buffer containing an SRT file
    const zip = new AdmZip();
    zip.addFile('subtitle.srt', Buffer.from(srtContent2, 'utf-8'));
    const zipBuffer = zip.toBuffer();

    // Create movie in DB
    await MovieModel.create({
      imdbId: imdbId2,
      tmdbId: 2,
      title: 'Test Movie 2',
      year: 2021,
      torrents: [
        {
          url: 'magnet:?xt=urn:btih:hash2',
          hash: 'hash2',
          quality: quality2,
          type: 'mp4',
          videoCodec: 'x264',
          seeds: 20,
          peers: 5,
          size: '1.4 GB',
          sizeBytes: 1400 * 1024 * 1024,
          provider: 'YTS',
        },
      ],
    });

    // Mock axios.get to return the zip buffer
    mockedAxios.get = jest.fn().mockResolvedValue({ data: zipBuffer });

    // Mock the internal client to return zip filename
    mockedAxios.create = jest.fn().mockReturnValue({
      get: jest.fn().mockResolvedValue({
        data: {
          data: [
            {
              attributes: {
                subtitle_id: 'sub2',
                language: language,
                files: [{ file_id: 222, file_name: `movie.${language}.zip` }],
              },
            },
          ],
        },
      }),
      post: jest.fn().mockImplementation((url: string) => {
        if (url === '/login') return Promise.resolve({ data: { token: 'test-token' } });
        if (url === '/download')
          return Promise.resolve({
            data: { link: 'http://example.com/movie.en.zip', file_name: `movie.${language}.zip` },
          });
        return Promise.resolve({ data: {} });
      }),
    } as unknown as AxiosInstance);

    const repo = new MovieRepository();
    const service = new SubtitleService(repo);

    const movie2 = await repo.findByImdbId(imdbId2);
    const torrent2 = movie2!.torrents[0];

    await service.ensureForMovie(imdbId2, language, torrent2 as any);

    const updated = await repo.findByImdbId(imdbId2);
    expect(updated).not.toBeNull();
    const subsForLang = updated!.subtitles?.get(language) || [];
    expect(subsForLang.length).toBeGreaterThan(0);

    const savedPath2 = path.join(
      process.cwd(),
      'public',
      'subtitles',
      imdbId2,
      language,
      `${quality2}.vtt`,
    );
    const stat2 = await fs.stat(savedPath2);
    expect(stat2.isFile()).toBe(true);

    // Verify VTT content (should be converted from SRT)
    const vttContent = await fs.readFile(savedPath2, 'utf-8');
    expect(vttContent).toContain('WEBVTT');
    expect(vttContent).toContain('Zipped subtitle test');

    // Cleanup
    await fs.rm(path.join(process.cwd(), 'public', 'subtitles', imdbId2), {
      recursive: true,
      force: true,
    });
  });

  it('extracts and converts subtitles from gzip archives', async () => {
    const imdbId3 = 'tt0000003';
    const quality3 = '480p';
    const srtContent3 = '1\n00:00:02,000 --> 00:00:04,500\nGzipped subtitle test\n';

    // Create a gzipped buffer
    const gzipBuffer = gzipSync(Buffer.from(srtContent3, 'utf-8'));

    // Create movie in DB
    await MovieModel.create({
      imdbId: imdbId3,
      tmdbId: 3,
      title: 'Test Movie 3',
      year: 2022,
      torrents: [
        {
          url: 'magnet:?xt=urn:btih:hash3',
          hash: 'hash3',
          quality: quality3,
          type: 'mp4',
          videoCodec: 'x264',
          seeds: 15,
          peers: 3,
          size: '500 MB',
          sizeBytes: 500 * 1024 * 1024,
          provider: 'YTS',
        },
      ],
    });

    // Mock axios.get to return the gzip buffer
    mockedAxios.get = jest.fn().mockResolvedValue({ data: gzipBuffer });

    // Mock the internal client to return gz filename
    mockedAxios.create = jest.fn().mockReturnValue({
      get: jest.fn().mockResolvedValue({
        data: {
          data: [
            {
              attributes: {
                subtitle_id: 'sub3',
                language: language,
                files: [{ file_id: 333, file_name: `movie.${language}.srt.gz` }],
              },
            },
          ],
        },
      }),
      post: jest.fn().mockImplementation((url: string) => {
        if (url === '/login') return Promise.resolve({ data: { token: 'test-token' } });
        if (url === '/download')
          return Promise.resolve({
            data: {
              link: 'http://example.com/movie.en.srt.gz',
              file_name: `movie.${language}.srt.gz`,
            },
          });
        return Promise.resolve({ data: {} });
      }),
    } as unknown as AxiosInstance);

    const repo = new MovieRepository();
    const service = new SubtitleService(repo);

    const movie3 = await repo.findByImdbId(imdbId3);
    const torrent3 = movie3!.torrents[0];

    await service.ensureForMovie(imdbId3, language, torrent3 as any);

    const updated = await repo.findByImdbId(imdbId3);
    expect(updated).not.toBeNull();
    const subsForLang = updated!.subtitles?.get(language) || [];
    expect(subsForLang.length).toBeGreaterThan(0);

    const savedPath3 = path.join(
      process.cwd(),
      'public',
      'subtitles',
      imdbId3,
      language,
      `${quality3}.vtt`,
    );
    const stat3 = await fs.stat(savedPath3);
    expect(stat3.isFile()).toBe(true);

    // Verify VTT content (should be converted from SRT)
    const vttContent = await fs.readFile(savedPath3, 'utf-8');
    expect(vttContent).toContain('WEBVTT');
    expect(vttContent).toContain('Gzipped subtitle test');

    // Cleanup
    await fs.rm(path.join(process.cwd(), 'public', 'subtitles', imdbId3), {
      recursive: true,
      force: true,
    });
  });

  it('re-authenticates when token expires', async () => {
    const imdbId4 = 'tt0000004';
    const quality4 = '720p';
    const srtContent4 = '1\n00:00:00,500 --> 00:00:02,000\nToken expiry test\n';

    // Track login calls
    let loginCallCount = 0;
    const mockClient = {
      get: jest.fn().mockResolvedValue({
        data: {
          data: [
            {
              attributes: {
                subtitle_id: 'sub4',
                language: language,
                files: [{ file_id: 444, file_name: `movie.${language}.srt` }],
              },
            },
          ],
        },
      }),
      post: jest.fn().mockImplementation((url: string) => {
        if (url === '/login') {
          loginCallCount++;
          return Promise.resolve({ data: { token: `test-token-${loginCallCount}` } });
        }
        if (url === '/download')
          return Promise.resolve({
            data: { link: 'http://example.com/movie.en.srt', file_name: `movie.${language}.srt` },
          });
        return Promise.resolve({ data: {} });
      }),
    };

    mockedAxios.create = jest.fn().mockReturnValue(mockClient as unknown as AxiosInstance);
    mockedAxios.get = jest.fn().mockResolvedValue({ data: Buffer.from(srtContent4, 'utf-8') });

    // Create movie in DB
    await MovieModel.create({
      imdbId: imdbId4,
      tmdbId: 4,
      title: 'Test Movie 4',
      year: 2023,
      torrents: [
        {
          url: 'magnet:?xt=urn:btih:hash4',
          hash: 'hash4',
          quality: quality4,
          type: 'mp4',
          videoCodec: 'x264',
          seeds: 25,
          peers: 8,
          size: '800 MB',
          sizeBytes: 800 * 1024 * 1024,
          provider: 'YTS',
        },
      ],
    });

    const repo = new MovieRepository();
    const service = new SubtitleService(repo);

    // First call - should trigger initial login
    const movie4 = await repo.findByImdbId(imdbId4);
    const torrent4 = movie4!.torrents[0];

    await service.ensureForMovie(imdbId4, language, torrent4 as any);

    // Verify login was called once
    expect(loginCallCount).toBe(1);

    // Mock Date.now() to simulate time passing (23 hours + 2 minutes)
    const realDateNow = Date.now;
    const startTime = realDateNow();
    Date.now = jest.fn(() => startTime + 23 * 60 * 60 * 1000 + 2 * 60 * 1000);

    // Second call on same service instance - should trigger re-login due to expiry
    const imdbId5 = 'tt0000005';
    await MovieModel.create({
      imdbId: imdbId5,
      tmdbId: 5,
      title: 'Test Movie 5',
      year: 2024,
      torrents: [
        {
          url: 'magnet:?xt=urn:btih:hash5',
          hash: 'hash5',
          quality: quality4,
          type: 'mp4',
          videoCodec: 'x264',
          seeds: 30,
          peers: 10,
          size: '900 MB',
          sizeBytes: 900 * 1024 * 1024,
          provider: 'YTS',
        },
      ],
    });

    const movie5 = await repo.findByImdbId(imdbId5);
    const torrent5 = movie5!.torrents[0];

    await service.ensureForMovie(imdbId5, language, torrent5 as any);

    // Verify login was called again (total 2 times)
    expect(loginCallCount).toBe(2);

    // Restore Date.now
    Date.now = realDateNow;

    // Cleanup
    await fs.rm(path.join(process.cwd(), 'public', 'subtitles', imdbId4), {
      recursive: true,
      force: true,
    });
    await fs.rm(path.join(process.cwd(), 'public', 'subtitles', imdbId5), {
      recursive: true,
      force: true,
    });
  }, 15000); // Increased timeout for this test
});
