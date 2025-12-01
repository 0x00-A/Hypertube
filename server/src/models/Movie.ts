import { Schema, model } from 'mongoose';

const movieSchema = new Schema(
  {
    title: { type: String, required: true },
    year: { type: Number, required: true },
    rating: { type: Number },
    coverUrl: { type: String },
  },
  { timestamps: true },
);

export const MovieModel = model('Movie', movieSchema);
