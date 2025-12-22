import type { IWatchProgress } from '../types/movie.types';



export const lastWatchingMovies: IWatchProgress[] = [
  {
    movie: {
      _id: '5',
      imdbId: 'tt0468569',
      title: 'The Dark Knight',
      year: 2008,
      rating: 9.0,
      duration: 152,
      synopsis: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
      genres: ['Action', 'Crime', 'Drama'],
      originalLanguage: 'en',
      images: {
        thumbnail: '/images/movies/dk-thumb.jpg',
        poster: '/images/movies/dk-poster.jpg',
        backdrop: 'https://image.tmdb.org/t/p/original/hkBaDkMWbLaf8B1lsWsKX7Ew3Xq.jpg',
      },
    },
    watchedDuration: 6840,
    totalDuration: 9120,
    percentage: 75.0,
    lastWatchedAt: new Date('2024-12-13T20:30:00'),
  },
  {
    movie: {
      _id: '6',
      imdbId: 'tt1375666',
      title: 'Inception',
      year: 2010,
      rating: 8.8,
      duration: 148,
      synopsis: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
      genres: ['Action', 'Sci-Fi', 'Thriller'],
      originalLanguage: 'en',
      images: {
        thumbnail: '/images/movies/inception-thumb.jpg',
        poster: '/images/movies/inception-poster.jpg',
        backdrop: 'https://image.tmdb.org/t/p/original/s3TBrRGB1iav7gFOCNx3H31MoES.jpg',
      },
    },
    watchedDuration: 4000,
    totalDuration: 8880,
    percentage: 45.0,
    lastWatchedAt: new Date('2024-12-12T19:15:00'),
  },
  {
    movie: {
      _id: '7',
      imdbId: 'tt0816692',
      title: 'Interstellar',
      year: 2014,
      rating: 8.6,
      duration: 169,
      synopsis: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
      genres: ['Adventure', 'Drama', 'Sci-Fi'],
      originalLanguage: 'en',
      images: {
        thumbnail: '/images/movies/interstellar-thumb.jpg',
        poster: '/images/movies/interstellar-poster.jpg',
        backdrop: 'https://image.tmdb.org/t/p/original/xu9zaAevzQ5nnrsXN6JcahLnG4i.jpg',
      },
    },
    watchedDuration: 9000,
    totalDuration: 10140,
    percentage: 88.8,
    lastWatchedAt: new Date('2024-12-11T21:45:00'),
  },
  {
    movie: {
      _id: '8',
      imdbId: 'tt0944947',
      title: 'Game of Thrones',
      year: 2011,
      rating: 9.2,
      duration: 57,
      synopsis: "It's the story of the intricate and bloody battles of several noble families in the fictional land of Westeros.",
      genres: ['Action', 'Adventure', 'Drama'],
      originalLanguage: 'en',
      images: {
        thumbnail: '/images/movies/got-thumb.jpg',
        poster: '/images/movies/got-poster.jpg',
        backdrop: 'https://image.tmdb.org/t/p/original/AaABt75ZzfMGrscUR2seabz4PEX.jpg',
      },
    },
    watchedDuration: 600,
    totalDuration: 3420,
    percentage: 17.5,
    lastWatchedAt: new Date('2024-12-10T18:00:00'),
  },
  {
    movie: {
      _id: '9',
      imdbId: 'tt1442437',
      title: 'Breaking Bad',
      year: 2008,
      rating: 9.5,
      duration: 49,
      synopsis: 'A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine.',
      genres: ['Crime', 'Drama', 'Thriller'],
      originalLanguage: 'en',
      images: {
        thumbnail: '/images/movies/bb-thumb.jpg',
        poster: '/images/movies/bb-poster.jpg',
        backdrop: 'https://image.tmdb.org/t/p/original/1n00NlOGRFZVs8coBxyZLm5l4EC.jpg',
      },
    },
    watchedDuration: 1800,
    totalDuration: 2940,
    percentage: 61.2,
    lastWatchedAt: new Date('2024-12-09T17:30:00'),
  },
];


