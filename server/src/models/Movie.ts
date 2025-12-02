import { Schema, model } from 'mongoose';
import { IMovieDocument, IMovieModel } from './movie.model.types';

const torrentSchema = new Schema({
  quality: { type: String, required: true }, // e.g., "720p", "1080p"
  hash: { type: String, required: true }, // Magnet hash
  seeds: { type: Number, required: true, min: 0 },
  peers: { type: Number, required: true, min: 0 },
  size: { type: String, required: true }, // Human-readable size (e.g., "1.2 GB")
  url: { type: String, required: true }, // Magnet link or torrent URL
});

const movieSchema = new Schema({
  // Normalized Data (The generic UI data)
  imdbId: { type: String, unique: true, required: true }, // The universal key
  title: { type: String, required: true },
  year: { type: Number, required: true, min: 1900, max: new Date().getFullYear() + 1 },
  rating: { type: Number, min: 0, max: 10 }, // IMDb/OMDb rating
  duration: { type: Number },
  summary: { type: String },
  coverImage: { type: String }, // URL
  backgroundImage: { type: String },

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
});

export const MovieModel = model<IMovieDocument, IMovieModel>('Movie', movieSchema);
