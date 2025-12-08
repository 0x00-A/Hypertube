import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div className="flex h-full items-center justify-center overflow-hidden px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center text-center"
      >
        {/* Error Message */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-8 text-lg font-medium text-primary"
        >
          Oops! The page you're looking for cannot be found.
        </motion.p>

        {/* 404 Image/SVG */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mb-12 w-full max-w-2xl"
        >
          <img
            src="/images/notFound/notFound.svg"
            alt="404 Not Found"
            className="h-auto w-full"
          />
        </motion.div>

        {/* Go Home Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <Link
            to="/"
            className="inline-block rounded-lg border-2 border-primary px-8 py-3 text-lg font-semibold uppercase text-primary transition-all duration-300 hover:bg-primary hover:text-black"
          >
            GO HOME
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}

