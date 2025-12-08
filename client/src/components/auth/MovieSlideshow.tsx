import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MOVIE_IMAGES = [
  '/images/movies/poster2.png',
  '/images/movies/poster1.png',
];

const SLIDE_INTERVAL = 4000; // 4 seconds per image

export default function MovieSlideshow() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-rotate images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % MOVIE_IMAGES.length);
    }, SLIDE_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      {/* Base image layer (always visible to prevent background flash) */}
      <div className="absolute inset-0">
        <img
          src={MOVIE_IMAGES[0]}
          alt="Background"
          className="h-full w-full object-cover opacity-30 blur-sm"
        />
      </div>

      {/* Slideshow */}
      <AnimatePresence initial={false}>
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.05, x: 50 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.95, x: -50 }}
          transition={{ 
            duration: 1.2, 
            ease: [0.43, 0.13, 0.23, 0.96] // Custom easing for smooth, elegant motion
          }}
          className="absolute inset-0"
        >
          <img
            src={MOVIE_IMAGES[currentIndex]}
            alt="Movie poster"
            className="h-full w-full object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* Gradient overlay for better contrast */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />

      {/* Optional: Branding/Text Overlay */}
      <div className="absolute bottom-8 left-8 z-10">
        <motion.h2
          key={`title-${currentIndex}`}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
          className="text-4xl font-bold text-white drop-shadow-lg"
        >
          Welcome to Hypertube
        </motion.h2>
        <motion.p
          key={`subtitle-${currentIndex}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8, ease: "easeOut" }}
          className="mt-2 text-lg text-gray-200 drop-shadow-md"
        >
          Stream unlimited movies and TV shows
        </motion.p>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-8 right-8 z-10 flex gap-2">
        {MOVIE_IMAGES.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 rounded-full transition-all duration-500 ease-out ${
              index === currentIndex 
                ? 'w-8 bg-white' 
                : 'w-2 bg-white/50 hover:bg-white/75 hover:w-4'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
