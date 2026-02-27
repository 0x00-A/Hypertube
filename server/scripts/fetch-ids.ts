/* eslint-disable no-console */
import fs from 'fs';
import axios from 'axios';
import csv from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';
import dotenv from 'dotenv';

dotenv.config();

const ACCESS_TOKEN = process.env.TMDB_API_ACCESS_TOKEN; // Make sure this is in your .env
const INPUT_FILE = 'movies.csv';
const OUTPUT_FILE = 'movies_complete.csv';

interface MovieRow {
  Index: string;
  Title: string;
  Year: string;
  Rating: string;
  User_Rating_Count: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function processMovies() {
  const movies: MovieRow[] = [];

  // 1. Read the CSV
  fs.createReadStream(INPUT_FILE)
    .pipe(csv())
    .on('data', (row) => movies.push(row))
    .on('end', async () => {
      console.log(`Loaded ${movies.length} movies. Starting API fetch...`);

      const enrichedMovies = [];

      for (const movie of movies) {
        try {
          // A. Search for the movie by Title and Year to get TMDB ID
          const searchUrl = `https://api.themoviedb.org/3/search/movie`;
          const searchRes = await axios.get(searchUrl, {
            headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
            params: {
              query: movie.Title,
              year: movie.Year, // Helps strictly match the correct movie
            },
          });

          if (searchRes.data.results.length > 0) {
            const bestMatch = searchRes.data.results[0];
            const tmdbId = bestMatch.id;

            // B. Get Details to find IMDb ID (it's not in the search result)
            const detailsUrl = `https://api.themoviedb.org/3/movie/${tmdbId}`;
            const detailsRes = await axios.get(detailsUrl, {
              headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
            });

            const imdbId = detailsRes.data.imdb_id;

            console.log(`✅ Found: ${movie.Title} -> TMDB: ${tmdbId}, IMDb: ${imdbId}`);

            enrichedMovies.push({
              ...movie,
              tmdb_id: tmdbId,
              imdb_id: imdbId,
            });
          } else {
            console.log(`❌ Not Found: ${movie.Title}`);
            enrichedMovies.push({ ...movie, tmdb_id: '', imdb_id: '' });
          }

          // Small delay to be polite to the API rate limits
          await sleep(200);
        } catch (error) {
          console.error(`Error processing ${movie.Title}:`, error);
          enrichedMovies.push({ ...movie, tmdb_id: 'ERROR', imdb_id: 'ERROR' });
        }
      }

      // 3. Write to new CSV
      const csvWriter = createObjectCsvWriter({
        path: OUTPUT_FILE,
        header: [
          { id: 'Index', title: 'Index' },
          { id: 'Title', title: 'Title' },
          { id: 'Year', title: 'Year' },
          { id: 'Rating', title: 'Rating' },
          { id: 'User_Rating_Count', title: 'User_Rating_Count' },
          { id: 'tmdb_id', title: 'tmdb_id' }, // New Column
          { id: 'imdb_id', title: 'imdb_id' }, // New Column
        ],
      });

      await csvWriter.writeRecords(enrichedMovies);
      console.log(`\n🎉 Done! Saved to ${OUTPUT_FILE}`);
    });
}

processMovies();
