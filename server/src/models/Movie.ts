import { Schema, model } from 'mongoose';
import { IMovieDocument, IMovieModel, MagnetLinkResult } from './movie.model.types';
import { ITorrent } from '../interfaces/movie.interface';

const torrentSchema = new Schema(
  {
    url: { type: String, required: true }, // Magnet link or torrent URL
    hash: { type: String, required: true }, // Magnet hash
    quality: { type: String, required: true }, // e.g., "720p", "1080p"
    type: { type: String }, // e.g., "mp4", "mkv"
    videoCodec: { type: String }, // x264
    seeds: { type: Number, required: true, min: 0 },
    peers: { type: Number, required: true, min: 0 },
    size: { type: String, required: true }, // Human-readable size (e.g., "1.2 GB")
    sizeBytes: { type: Number, required: true }, // Size in bytes for easier calculations
    provider: { type: String }, // Source of the torrent (e.g., YTS, PopcornTime)
  },
  { _id: false },
);

const castSchema = new Schema(
  {
    id: { type: Number, required: true },
    name: { type: String, required: true },
    character: { type: String, required: true },
    profilePath: { type: String },
  },
  { _id: false },
);

const crewMemberSchema = new Schema(
  {
    id: { type: Number, required: true },
    name: { type: String, required: true },
    profilePath: { type: String },
  },
  { _id: false },
);

const productionCompanySchema = new Schema(
  {
    id: { type: Number, required: true },
    name: { type: String, required: true },
    logoPath: { type: String },
    originCountry: { type: String },
  },
  { _id: false },
);

const subtitleSchema = new Schema(
  {
    id: { type: String },
    fileId: { type: Number },
    fileName: { type: String },
    language: { type: String, required: true },
    label: { type: String, required: true },
    forHash: { type: String, required: true }, // torrent hash this subtitle is linked to
    forQuality: { type: String, required: true }, // torrent quality (e.g., '720p', '1080p')
    url: { type: String },
    localPath: { type: String },
    provider: { type: String },
    isDefault: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
  },
  { _id: false },
);

const movieSchema = new Schema(
  {
    // Normalized Data (The generic UI data)
    imdbId: { type: String, unique: true, required: true }, // The universal key
    tmdbId: { type: Number, unique: true, required: true }, // TMDB ID for metadata linkage
    title: { type: String, required: true },
    year: { type: Number, required: true, min: 1900, max: new Date().getFullYear() + 1 },
    rating: { type: Number, min: 0, max: 10, default: null }, // IMDb/OMDb rating, allows 0 or null
    duration: { type: Number, min: 0, default: null }, // Duration in minutes, allows 0 or null
    synopsis: { type: String },
    genres: [{ type: String }], // Array for filtering
    originalLanguage: { type: String, default: 'en' }, // Original language
    trailer: { type: String },
    cast: { type: [castSchema], default: () => [] }, // Up to 18 main actors
    director: { type: crewMemberSchema, default: null }, // Movie director
    producer: { type: crewMemberSchema, default: null }, // First producer with Production department
    productionCompanies: { type: [productionCompanySchema], default: () => [] }, // Production companies

    images: {
      thumbnail: { type: String }, // Medium image for lists
      poster: { type: String }, // Large image for detail view
      backdrop: { type: String }, // Background image for detail view
    },

    // Torrent Data (The engine room)
    torrents: { type: [torrentSchema], default: () => [] },

    // Local File Status (For Dev 2's Cache Manager)
    downloadStatus: {
      type: String,
      enum: ['not_downloaded', 'downloading', 'downloaded'],
      default: 'not_downloaded',
    },
    lastWatched: { type: Date, default: null }, // Vital for the 1-month deletion rule
    localPath: { type: String, default: null }, // Path to the file on your server
    lastUpdated: { type: Date, default: Date.now }, // Last updated timestamp
    metadataSource: { type: String, default: 'tmdb' }, // Source of metadata
    isWatched: { type: Boolean, default: false },
    inWatchlist: { type: Boolean, default: false },
    userRating: { type: Number, min: 1, max: 10, default: null },
    // Numeric rank for curated top-ranked movies (seeded). null = not ranked
    topRank: { type: Number, min: 1, default: null },
    // subtitles stored as: { 'en': [...], 'es': [...] }
    subtitles: {
      type: Map,
      of: [subtitleSchema],
      default: () => ({}),
    },
  },
  { versionKey: false },
);

movieSchema.methods.getMagnetLinks = function (): MagnetLinkResult[] {
  // Recommended trackers from YTS docs
  const trackers = [
    'udp://open.demonii.com:1337/announce',
    'udp://tracker.openbittorrent.com:80/announce',
    'udp://tracker.coppersurfer.tk:6969/announce',
    'udp://glotorrents.pw:6969/announce',
    'udp://tracker.opentrackr.org:1337/announce',
    'udp://torrent.gresille.org:80/announce',
    'udp://p4p.arenabg.com:1337',
    'udp://tracker.leechers-paradise.org:6969',
  ];

  // Helper to URL-encode the movie title
  const encodeTitle = (title: string) => encodeURIComponent(title);

  return this.torrents.map((torrent: ITorrent) => {
    let magnet: string;
    if (torrent.url && torrent.url.startsWith('magnet:?')) {
      magnet = torrent.url;
    } else {
      const hash = torrent.hash;
      const title = encodeTitle(this.title);
      const trackerParams = trackers.map((tr) => `&tr=${encodeURIComponent(tr)}`).join('');
      magnet = `magnet:?xt=urn:btih:${hash}&dn=${title}${trackerParams}`;
    }
    return {
      magnet,
      quality: torrent.quality,
      type: torrent.type,
      size: torrent.size,
      provider: torrent.provider,
      seeds: torrent.seeds,
      peers: torrent.peers,
      videoCodec: torrent.videoCodec,
    };
  });
};

movieSchema.index({ title: 'text', synopsis: 'text' });
movieSchema.index({ year: 1, rating: -1, genres: 1 });

export const MovieModel = model<IMovieDocument, IMovieModel>('Movie', movieSchema);
