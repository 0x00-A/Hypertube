import { IMovie, ISubtitle, ITorrent } from '../interfaces/movie.interface';
import { env } from '../config/env';
import axios, { AxiosError, AxiosInstance } from 'axios';
import { logger } from '../utils/logger';
import {
  DownloadLinkResponse,
  OpenSubtitlesLogin,
  OpenSubtitlesSearchResponse,
} from '../interfaces/subtitle.interface';
import { MovieRepository } from '../repositories/movie.repository';
import * as fs from 'fs/promises';
import * as path from 'path';
import { gunzip } from 'zlib';
import { promisify } from 'util';

const gunzipAsync = promisify(gunzip);
// @ts-ignore - no type definitions available for unzipper
import * as unzipper from 'unzipper';

const OPEN_SUBTITLES_API_URL = env.OPEN_SUBTITLES_API_URL;
const OPEN_SUBTITLES_API_KEY = env.OPEN_SUBTITLES_API_KEY;
const OPEN_SUBTITLES_USERNAME = env.OPEN_SUBTITLES_USERNAME;
const OPEN_SUBTITLES_PASSWORD = env.OPEN_SUBTITLES_PASSWORD;
const OPEN_SUBTITLES_USER_AGENT = env.OPEN_SUBTITLES_USER_AGENT;

export class SubtitleService {
  private _client: AxiosInstance;
  private _token: string | null = null;
  private _tokenExpiresAt: number | null = null;
  private readonly _credentials: { username: string; password: string };
  private _movieRepository: MovieRepository;

  constructor(movieRepository: MovieRepository) {
    this._movieRepository = movieRepository;

    this._credentials = {
      username: OPEN_SUBTITLES_USERNAME,
      password: OPEN_SUBTITLES_PASSWORD,
    };

    this._client = axios.create({
      baseURL: OPEN_SUBTITLES_API_URL,
      headers: {
        'Api-Key': OPEN_SUBTITLES_API_KEY,
        'Content-Type': 'application/json',
        'User-Agent': OPEN_SUBTITLES_USER_AGENT,
      },
    });
  }

  private subtitleExistsForTorrent(
    movie: IMovie,
    language: string,
    torrentHash: string,
    torrentQuality: string,
  ): boolean {
    const subsForLang = movie.subtitles?.get(language);
    if (!subsForLang || subsForLang.length === 0) return false;

    return subsForLang.some(
      (sub) => sub.forHash === torrentHash && sub.forQuality === torrentQuality,
    );
  }

  async ensureForMovie(imdbId: string, language: string, torrent: ITorrent): Promise<void> {
    const movie = await this._movieRepository.findByImdbId(imdbId);
    if (!movie) throw new Error('Movie not found');

    // Check if subtitle already exists for this torrent
    if (this.subtitleExistsForTorrent(movie, language, torrent.hash, torrent.quality)) {
      logger.info(`Subtitle already exists for ${imdbId} ${language} ${torrent.quality}`);
      return;
    }

    // Search for subtitles on OpenSubtitles
    let subtitles = await this.searchByImdb(imdbId, language);

    const bestSubtitle = await this.findBestSubtitle(torrent, subtitles);
    if (!bestSubtitle) {
      logger.warn(`No suitable subtitle found for movie ${imdbId} in language ${language}`);
      return;
    }
    logger.info(`Best subtitle found: ${JSON.stringify(bestSubtitle)}`);

    const downloadInfo = await this.getDownloadLink(bestSubtitle.fileId);

    // Download the subtitle file
    const subtitleBuffer = await this.downloadSubtitleFile(downloadInfo.link);

    // Extract from archive if needed (handles .gz, .zip)
    const { buffer: extractedBuffer, fileName: extractedName } =
      await this.extractSubtitleFromArchive(subtitleBuffer, bestSubtitle.fileName);

    // Convert to VTT format
    const vttContent = await this.convertToVTT(extractedBuffer, extractedName);

    // Save to filesystem
    const subtitlePath = await this.saveSubtitleFile(vttContent, imdbId, language, torrent.quality);

    // Build subtitle object
    const subtitle: ISubtitle = {
      id: bestSubtitle.id,
      fileId: bestSubtitle.fileId,
      fileName: bestSubtitle.fileName,
      language: language,
      label: this.getLanguageLabel(language),
      forHash: torrent.hash,
      forQuality: torrent.quality,
      url: `/api/subtitles/${imdbId}/${language}/${torrent.quality}.vtt`,
      localPath: subtitlePath,
      provider: 'opensubtitles',
      createdAt: new Date(),
    };

    await this._movieRepository.addSubtitleToMovie(imdbId, language, subtitle);

    logger.info(
      `Successfully added subtitle for ${imdbId} ${language} ${torrent.quality} at ${subtitlePath}`,
    );
  }

  private async searchByImdb(imdbId: string, language: string): Promise<any> {
    const authHeader = await this.getAuthHeader();
    const cleanId = imdbId.replace('tt', '');
    const response = await this._client.get<OpenSubtitlesSearchResponse>('/subtitles', {
      headers: {
        ...authHeader,
      },
      params: {
        imdb_id: cleanId,
        languages: language,
        order_by: 'download_count', // Get mostly used subs
        order_direction: 'desc',
      },
    });
    logger.info(
      `OpenSubtitles response data: ${JSON.stringify(response.data.data[0].attributes.files)}`,
    );

    return response.data.data.map((item) => {
      const attrs = item.attributes;
      return {
        id: attrs.subtitle_id,
        fileName: attrs.files[0].file_name,
        fileId: attrs.files[0].file_id,
        language: attrs.language,
      };
    });
  }

  public async getDownloadLink(fileId: number) {
    logger.info(`Getting download link for file ID: ${fileId}`);
    const authHeader = await this.getAuthHeader();

    const { data } = await this._client.post<DownloadLinkResponse>(
      '/download',
      { file_id: fileId },
      { headers: { ...authHeader, Accept: 'application/json' } },
    );

    return data;
  }

  private async login(): Promise<void> {
    try {
      const response = await this._client.post<OpenSubtitlesLogin>('/login', {
        username: this._credentials.username,
        password: this._credentials.password,
      });
      this._token = response.data.token;
      const DEFAULT_TTL_MS = 23 * 60 * 60 * 1000; // 23 hours
      this._tokenExpiresAt = Date.now() + DEFAULT_TTL_MS;
      logger.info('Successfully logged in to OpenSubtitles');
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      logger.error({ error: axiosError?.message }, 'Failed to login to OpenSubtitles');
      throw new Error('Could not authenticate with OpenSubtitles');
    }
  }

  private async getAuthHeader(): Promise<{ Authorization: string }> {
    const BUFFER_MS = 60 * 1000; // 1 minute
    const isExpired =
      !this._token || !this._tokenExpiresAt || Date.now() >= this._tokenExpiresAt - BUFFER_MS;

    if (isExpired) {
      await this.login();
    }

    if (!this._token) {
      throw new Error('Failed to obtain OpenSubtitles auth token');
    }

    return { Authorization: `Bearer ${this._token}` };
  }

  private async downloadSubtitleFile(url: string): Promise<Buffer> {
    logger.info(`Downloading subtitle from: ${url}`);
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data);
  }

  private async extractSubtitleFromArchive(
    buffer: Buffer,
    fileName: string,
  ): Promise<{ buffer: Buffer; fileName: string }> {
    const lower = fileName.toLowerCase();
    // gzip (.gz)
    if (lower.endsWith('.gz') || buffer.subarray(0, 2).equals(Buffer.from([0x1f, 0x8b]))) {
      try {
        const unz = await gunzipAsync(buffer);
        // try to guess filename inside gz by stripping .gz
        return { buffer: unz, fileName: fileName.replace(/\.gz$/i, '') };
      } catch (err) {
        logger.warn({ err: (err as Error).message }, 'Failed to gunzip subtitle archive');
      }
    }

    // zip
    if (
      lower.endsWith('.zip') ||
      buffer.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))
    ) {
      try {
        const zip = await unzipper.Open.buffer(buffer);
        // prefer .vtt then .srt
        const entry =
          zip.files.find((e: any) => e.path.toLowerCase().endsWith('.vtt')) ??
          zip.files.find((e: any) => e.path.toLowerCase().endsWith('.srt'));
        if (entry) {
          const content = await entry.buffer();
          return { buffer: content, fileName: entry.path };
        }
      } catch (err) {
        logger.warn({ err: (err as Error).message }, 'Failed to extract zip subtitle');
      }
    }

    // nothing recognized -> return original
    return { buffer, fileName };
  }

  private async convertToVTT(buffer: Buffer, fileName: string): Promise<string> {
    // Detect format from file extension
    const ext = path.extname(fileName).toLowerCase();
    const content = buffer.toString('utf-8');

    if (ext === '.vtt' || content.startsWith('WEBVTT')) {
      return content;
    }

    if (ext === '.srt' || this.isSRTFormat(content)) {
      return this.srtToVtt(content);
    }

    return this.srtToVtt(content);
  }

  private isSRTFormat(content: string): boolean {
    // SRT format starts with a number followed by timecode
    return /^\d+\s*\r?\n\d{2}:\d{2}:\d{2},\d{3}/.test(content);
  }

  private srtToVtt(srtContent: string): string {
    let vtt = 'WEBVTT\n\n';
    // Replace SRT timestamp format (00:00:00,000) with VTT format (00:00:00.000)
    vtt += srtContent.replace(/,(\d{3})/g, '.$1');
    return vtt;
  }

  private async saveSubtitleFile(
    content: string,
    imdbId: string,
    language: string,
    quality: string,
  ): Promise<string> {
    // Create directory structure: server/public/subtitles/{imdbId}/{language}/
    const subtitlesDir = path.join(process.cwd(), 'public', 'subtitles', imdbId, language);
    await fs.mkdir(subtitlesDir, { recursive: true });

    // Save file as {quality}.vtt
    const fileName = `${quality}.vtt`;
    const filePath = path.join(subtitlesDir, fileName);

    await fs.writeFile(filePath, content, 'utf-8');
    logger.info(`Saved subtitle to: ${filePath}`);

    return filePath;
  }

  private getLanguageLabel(languageCode: string): string {
    const languageMap: Record<string, string> = {
      en: 'English',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      it: 'Italian',
      pt: 'Portuguese',
      ru: 'Russian',
      ja: 'Japanese',
      zh: 'Chinese',
      ar: 'Arabic',
      hi: 'Hindi',
      ko: 'Korean',
      nl: 'Dutch',
      pl: 'Polish',
      tr: 'Turkish',
      sv: 'Swedish',
      da: 'Danish',
      fi: 'Finnish',
      no: 'Norwegian',
      cs: 'Czech',
      ro: 'Romanian',
      hu: 'Hungarian',
      el: 'Greek',
      th: 'Thai',
      vi: 'Vietnamese',
      id: 'Indonesian',
      he: 'Hebrew',
      fa: 'Persian',
    };
    return languageMap[languageCode] || languageCode.toUpperCase();
  }

  private async findBestSubtitle(torrent: ITorrent, subtitles: any[]): Promise<any | null> {
    const torrentQuality = torrent.quality;
    const isYTS = torrent.provider === 'YTS';

    const qualityKeywords = [torrentQuality];
    if (torrentQuality === '2160p') qualityKeywords.push('4k', 'uhd');

    // Map subtitles to a score
    const scoredSubtitles = subtitles.map((sub) => {
      let score = 0;
      const lowerName = sub.fileName.toLowerCase();

      if (isYTS && (lowerName.includes('yify') || lowerName.includes('yts'))) {
        score += 50;
      }

      if (
        torrent.type === 'bluray' &&
        (lowerName.includes('bluray') || lowerName.includes('brrip'))
      ) {
        score += 20;
      }

      if (qualityKeywords.some((q) => lowerName.includes(q))) {
        score += 10;
      }

      if (lowerName.includes('cam') || lowerName.includes('ts') || lowerName.includes('dvdrip')) {
        score -= 50;
      }

      if (lowerName.includes('cd1') || lowerName.includes('cd2')) {
        score -= 20;
      }

      return { ...sub, score };
    });

    scoredSubtitles.sort((a, b) => b.score - a.score);

    return scoredSubtitles[0];
  }
}
