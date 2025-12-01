import { Schema, model } from 'mongoose';

const movieSchema = new Schema({
  // Normalized Data (The generic UI data)
  imdbId: { type: String, unique: true, required: true }, // The universal key
  title: { type: String, required: true },
  year: { type: Number },
  rating: { type: Number }, // IMDb/OMDb rating [cite: 65]
  duration: { type: Number },
  summary: { type: String },
  coverImage: { type: String }, // URL
  backgroundImage: { type: String },

  // Torrent Data (The engine room)
  torrents: [
    {
      quality: { type: String }, // e.g., "720p", "1080p"
      hash: { type: String }, // The Magnet Hash
      seeds: { type: Number },
      peers: { type: Number },
      size: { type: String },
      url: { type: String }, // Magnet link or .torrent URL
    },
  ],

  // Local File Status (For Dev 2's Cache Manager)
  downloadStatus: {
    type: String,
    enum: ['not_downloaded', 'downloading', 'downloaded'],
    default: 'not_downloaded',
  },
  lastWatched: { type: Date, default: null }, // Vital for the 1-month deletion rule
  localPath: { type: String }, // Path to the file on your server
});

export const MovieModel = model('Movie', movieSchema);
