import { Schema, model } from 'mongoose';
import { IMovieDocument, IMovieModel } from './movie.model.types';

const torrentSchema = new Schema(
  {
    url: { type: String, required: true }, // Magnet link or torrent URL
    hash: { type: String, required: true }, // Magnet hash
    quality: { type: String, required: true }, // e.g., "720p", "1080p"
    type: { type: String }, // e.g., "mp4", "mkv"
    seeds: { type: Number, required: true, min: 0 },
    peers: { type: Number, required: true, min: 0 },
    size: { type: String, required: true }, // Human-readable size (e.g., "1.2 GB")
    sizeBytes: { type: Number, required: true }, // Size in bytes for easier calculations
    provider: { type: String }, // Source of the torrent (e.g., YTS, PopcornTime)
  },
  { _id: false },
);

const movieSchema = new Schema({
  // Normalized Data (The generic UI data)
  imdbId: { type: String, unique: true, required: true }, // The universal key
  title: { type: String, required: true },
  year: { type: Number, required: true, min: 1900, max: new Date().getFullYear() + 1 },
  rating: { type: Number, min: 0, max: 10 }, // IMDb/OMDb rating
  duration: { type: Number },
  synopsis: { type: String },
  genres: [{ type: String }], // Array for filtering
  language: { type: String }, // Original language

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
});

export const MovieModel = model<IMovieDocument, IMovieModel>('Movie', movieSchema);
