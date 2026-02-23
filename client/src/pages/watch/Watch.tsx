/**
 * Watch Page - Real Streaming Experience
 *
 * Streams video from the backend via GET /api/v1/stream/:movieId
 * with native <video> element, HTTP Range support for seeking,
 * subtitle tracks, and real watch progress tracking.
 */

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Share2,
  Star,
  Plus,
  Check,
  Loader2,
  Subtitles,
} from "lucide-react";
import { clsx } from "clsx";
import { useMovieDetails } from "../../hooks/useMovieDetails";
import {
  useAddToWatchlist,
  useRemoveFromWatchlist,
} from "../../hooks/useMovieInteractions";
import { useUserRating } from "../../hooks/useUserRating";
import { CommentSection } from "../../components/comments";
import { MovieRating } from "../../components/movie";
import ShareModal from "../../components/common/ShareModal";
import { streamingService } from "../../services/streaming.service";
import { movieInteractionService } from "../../services/movieInteraction.service";
import toast from "react-hot-toast";
import type { ISubtitleTrack } from "../../types/movie.types";

// ============================================================================
// Constants
// ============================================================================

const PROGRESS_SAVE_INTERVAL = 15_000; // Save progress every 15 seconds
const CONTROLS_AUTO_HIDE_DELAY = 3_000;

// Backend origin for static subtitle files (served at /api/subtitles/...)
const BACKEND_ORIGIN = (
  import.meta.env.VITE_API_URL || "http://localhost:3000/api"
).replace(/\/api(\/v1)?$/, "");

// ============================================================================
// Helpers
// ============================================================================

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// ============================================================================
// Component
// ============================================================================

export default function Watch() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  // Get movie details
  const isTmdbMovie = location.state?.isTmdbMovie ?? true;
  const {
    data: movie,
    isLoading,
    error,
  } = useMovieDetails({ id: id || "", isTmdbMovie });

  // Video element ref
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<number | null>(null);
  const progressSaveRef = useRef<number | null>(null);
  const lastSavedTimeRef = useRef<number>(0);

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isBuffering, setIsBuffering] = useState(true);
  const [volume, setVolume] = useState(1);
  const [subtitleTracks, setSubtitleTracks] = useState<ISubtitleTrack[]>([]);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const [activeSubtitleLang, setActiveSubtitleLang] = useState<string | null>(
    "en",
  );
  const [activeCueText, setActiveCueText] = useState<string>("");

  // Derived stream URL — purely computed from movie._id, no state needed
  const movieId = movie?._id ?? "";
  const streamUrl = useMemo(
    () => (movieId ? streamingService.getStreamUrl(movieId) : null),
    [movieId],
  );

  // Storyline state
  const [isStoryExpanded, setIsStoryExpanded] = useState(false);

  // Rating modal state
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const { data: currentRating } = useUserRating(movie?._id ?? "");

  // Share modal state
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Watchlist mutations
  const { mutate: addToWatchlist, isPending: isAdding } = useAddToWatchlist();
  const { mutate: removeFromWatchlist, isPending: isRemoving } =
    useRemoveFromWatchlist();

  // ========================================================================
  // Initialize stream URL + load saved progress
  // ========================================================================

  useEffect(() => {
    if (!movieId) return;

    // Fetch saved progress to resume
    movieInteractionService
      .getWatchProgress(movieId)
      .then((progress) => {
        if (progress?.lastWatchedPosition && videoRef.current) {
          videoRef.current.currentTime = progress.lastWatchedPosition;
        }
      })
      .catch(() => {
        /* ignore */
      });

    // Fetch subtitles from status endpoint
    streamingService
      .getStreamStatus(movieId)
      .then((status) => {
        const tracks: ISubtitleTrack[] = [];
        for (const lang of Object.keys(status.subtitles)) {
          for (const sub of status.subtitles[lang]) {
            if (sub.url) {
              tracks.push(sub);
            }
          }
        }
        setSubtitleTracks(tracks);
      })
      .catch(() => {
        /* subtitles not available yet */
      });
  }, [movieId]);

  // ========================================================================
  // Programmatically manage subtitle tracks on the <video> element
  // ========================================================================

  useEffect(() => {
    const video = videoRef.current;
    if (!video || subtitleTracks.length === 0) return;

    // Remove any existing <track> elements we previously added
    const existingTracks = video.querySelectorAll("track[data-managed]");
    existingTracks.forEach((t) => t.remove());

    // Store cuechange handlers for cleanup
    const cueChangeHandlers: Array<{ track: TextTrack; handler: () => void }> =
      [];

    // Add each subtitle as a <track> element
    subtitleTracks.forEach((sub) => {
      const trackEl = document.createElement("track");
      trackEl.kind = "subtitles";
      trackEl.label = sub.label;
      trackEl.srclang = sub.language;
      trackEl.src = `${BACKEND_ORIGIN}${sub.url}`;
      trackEl.setAttribute("data-managed", "true");
      video.appendChild(trackEl);
    });

    // Set all tracks to 'hidden' (loads cues but no native rendering)
    // and attach cuechange listener to the active language
    for (let i = 0; i < video.textTracks.length; i++) {
      const tt = video.textTracks[i];
      tt.mode = "hidden";

      if (tt.language === activeSubtitleLang) {
        const handler = () => {
          if (!tt.activeCues || tt.activeCues.length === 0) {
            setActiveCueText("");
            return;
          }
          const texts: string[] = [];
          for (let j = 0; j < tt.activeCues.length; j++) {
            const cue = tt.activeCues[j] as VTTCue;
            texts.push(cue.text);
          }
          setActiveCueText(texts.join("\n"));
        };
        tt.addEventListener("cuechange", handler);
        cueChangeHandlers.push({ track: tt, handler });
      }
    }

    return () => {
      cueChangeHandlers.forEach(({ track, handler }) => {
        track.removeEventListener("cuechange", handler);
      });
    };
  }, [subtitleTracks, activeSubtitleLang]);

  // ========================================================================
  // Periodically save watch progress
  // ========================================================================

  const saveProgress = useCallback(() => {
    if (!movieId || !videoRef.current) return;
    const video = videoRef.current;
    if (video.currentTime <= 0 || !isFinite(video.duration)) return;

    // Only save if time changed by at least 5 seconds
    if (Math.abs(video.currentTime - lastSavedTimeRef.current) < 5) return;

    lastSavedTimeRef.current = video.currentTime;
    movieInteractionService
      .updateWatchProgress(movieId, video.currentTime, video.duration)
      .catch(() => {
        /* non-critical */
      });
  }, [movieId]);

  useEffect(() => {
    if (isPlaying) {
      progressSaveRef.current = window.setInterval(
        saveProgress,
        PROGRESS_SAVE_INTERVAL,
      );
    }
    return () => {
      if (progressSaveRef.current) {
        window.clearInterval(progressSaveRef.current);
        progressSaveRef.current = null;
      }
    };
  }, [isPlaying, saveProgress]);

  // Save progress on unmount
  useEffect(() => {
    return () => {
      saveProgress();
    };
  }, [saveProgress]);

  // ========================================================================
  // Auto-hide controls
  // ========================================================================

  useEffect(() => {
    if (showControls && isPlaying) {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = window.setTimeout(() => {
        setShowControls(false);
        setShowSubtitleMenu(false);
      }, CONTROLS_AUTO_HIDE_DELAY);
    }
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [showControls, isPlaying]);

  // ========================================================================
  // Fullscreen change listener
  // ========================================================================

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  // ========================================================================
  // Video event handlers
  // ========================================================================

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);

    // Update buffered range
    if (video.buffered.length > 0) {
      setBuffered(video.buffered.end(video.buffered.length - 1));
    }
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration);
    setIsBuffering(false);

    // Resume from saved position (set in useEffect above)
    if (movieId) {
      movieInteractionService
        .getWatchProgress(movieId)
        .then((progress) => {
          if (progress?.lastWatchedPosition && video) {
            video.currentTime = progress.lastWatchedPosition;
          }
        })
        .catch(() => {
          /* ignore */
        });
    }
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleWaiting = () => setIsBuffering(true);
  const handleCanPlay = () => setIsBuffering(false);

  const handleEnded = () => {
    setIsPlaying(false);
    saveProgress();
  };

  // ========================================================================
  // Player controls
  // ========================================================================

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {
        /* autoplay blocked */
      });
    } else {
      video.pause();
    }
    setShowControls(true);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const vol = parseFloat(e.target.value);
    video.volume = vol;
    setVolume(vol);
    setIsMuted(vol === 0);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && videoContainerRef.current) {
      videoContainerRef.current.requestFullscreen();
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !isFinite(duration)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    video.currentTime = Math.max(0, Math.min(duration, newTime));
    setCurrentTime(video.currentTime);
  };

  const handleMouseMove = () => {
    setShowControls(true);
  };

  const handleSubtitleSelect = (lang: string | null) => {
    setActiveSubtitleLang(lang);
    setShowSubtitleMenu(false);
    if (!lang) setActiveCueText("");
  };

  // Handle watchlist toggle
  const handleWatchlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!movie) return;

    if (movie.inWatchlist) {
      if (movie._id) {
        removeFromWatchlist(movie._id);
      } else {
        toast.error("Cannot remove from watchlist: Missing movie ID");
      }
    } else {
      const movieId = movie._id || movie.tmdbId;
      const isTmdb = !movie._id;

      if (movieId) {
        addToWatchlist({ id: movieId, isTmdbMovie: isTmdb });
      } else {
        toast.error("Cannot add to watchlist: Missing movie identifier");
      }
    }
  };

  // ========================================================================
  // Render - Loading / Error states
  // ========================================================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-text-secondary">Loading movie...</p>
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl text-white font-bold mb-4">
            Movie not found
          </h2>
          <button
            onClick={() => navigate("/movies")}
            className="text-primary hover:underline"
          >
            Back to Movies
          </button>
        </div>
      </div>
    );
  }

  const posterUrl = movie.images?.poster || movie.images?.thumbnail;
  const storyline = movie.synopsis || movie.overview || "";
  const truncatedStoryline =
    storyline.length > 300 ? storyline.substring(0, 300) + "..." : storyline;
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;
  const isWatchlistLoading = isAdding || isRemoving;

  // ========================================================================
  // Render
  // ========================================================================

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Video Player Section */}
        <div
          ref={videoContainerRef}
          className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border-2 border-primary/30 cursor-pointer group"
          onMouseMove={handleMouseMove}
          onClick={togglePlay}
        >
          {/* Native Video Element */}
          {streamUrl ? (
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              src={streamUrl}
              crossOrigin="use-credentials"
              preload="auto"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={handlePlay}
              onPause={handlePause}
              onWaiting={handleWaiting}
              onCanPlay={handleCanPlay}
              onEnded={handleEnded}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
          )}

          {/* Buffering indicator */}
          {isBuffering && streamUrl && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
            </div>
          )}

          {/* Play button overlay when paused and not buffering */}
          {!isPlaying && !isBuffering && streamUrl && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="w-20 h-20 rounded-full bg-black/50 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:border-primary">
                <Play className="w-10 h-10 text-white fill-white ml-1" />
              </div>
            </div>
          )}

          {/* Custom Subtitle Overlay */}
          {activeCueText && (
            <div className="absolute left-0 right-0 bottom-20 flex justify-center pointer-events-none px-8">
              <span className="bg-black/80 text-white text-base md:text-lg px-3 py-1.5 rounded text-center leading-relaxed whitespace-pre-line max-w-[80%]">
                {activeCueText}
              </span>
            </div>
          )}

          {/* Video Controls */}
          <div
            className={clsx(
              "absolute bottom-0 left-0 right-0 p-4 bg-linear-to-t from-black/90 to-transparent transition-opacity duration-300",
              showControls ? "opacity-100" : "opacity-0 pointer-events-none",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Progress Bar */}
            <div
              className="w-full py-2 cursor-pointer group/progress"
              onClick={handleProgressClick}
            >
              <div className="w-full h-1 bg-white/20 rounded-full relative group-hover/progress:h-1.5 transition-all">
                {/* Buffered bar */}
                <div
                  className="absolute h-full bg-white/30 rounded-full"
                  style={{ width: `${bufferedPercent}%` }}
                />
                {/* Progress bar */}
                <div
                  className="absolute h-full bg-primary rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
                {/* Scrub handle */}
                <div
                  className="absolute w-3 h-3 bg-primary rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity"
                  style={{
                    left: `${progressPercent}%`,
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                  }}
                />
              </div>
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between mt-3">
              {/* Left Controls */}
              <div className="flex items-center gap-3">
                <button
                  className="w-9 h-9 flex items-center justify-center rounded text-white hover:bg-white/10 hover:text-primary transition-colors"
                  onClick={togglePlay}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6 ml-0.5" />
                  )}
                </button>

                <span className="text-sm text-white/90 tabular-nums">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>

                {/* Volume controls */}
                <div className="flex items-center group/vol">
                  <button
                    className="w-9 h-9 flex items-center justify-center rounded text-white hover:bg-white/10 hover:text-primary transition-colors"
                    onClick={toggleMute}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </button>
                  <div className="w-0 overflow-hidden group-hover/vol:w-24 transition-all duration-200">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-24 ml-1 accent-primary cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-2">
                {/* Subtitles toggle */}
                <div className="relative">
                  <button
                    className={clsx(
                      "w-9 h-9 flex items-center justify-center rounded transition-colors",
                      activeSubtitleLang
                        ? "text-primary bg-white/10"
                        : "text-white hover:bg-white/10 hover:text-primary",
                    )}
                    onClick={() =>
                      subtitleTracks.length > 0 &&
                      setShowSubtitleMenu(!showSubtitleMenu)
                    }
                    title={
                      subtitleTracks.length === 0
                        ? "No subtitles available"
                        : "Subtitles"
                    }
                  >
                    <Subtitles className="w-5 h-5" />
                  </button>

                  {showSubtitleMenu && subtitleTracks.length > 0 && (
                    <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg border border-white/20 py-1 min-w-[140px]">
                      <button
                        className={clsx(
                          "w-full px-3 py-1.5 text-left text-sm hover:bg-white/10 transition-colors",
                          !activeSubtitleLang ? "text-primary" : "text-white",
                        )}
                        onClick={() => handleSubtitleSelect(null)}
                      >
                        Off
                      </button>
                      {subtitleTracks.map((track) => (
                        <button
                          key={track.language}
                          className={clsx(
                            "w-full px-3 py-1.5 text-left text-sm hover:bg-white/10 transition-colors",
                            activeSubtitleLang === track.language
                              ? "text-primary"
                              : "text-white",
                          )}
                          onClick={() => handleSubtitleSelect(track.language)}
                        >
                          {track.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  className="w-9 h-9 flex items-center justify-center rounded text-white hover:bg-white/10 hover:text-primary transition-colors"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? (
                    <Minimize className="w-5 h-5" />
                  ) : (
                    <Maximize className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Movie Info Section */}
        <div className="mt-6">
          {/* Title Row */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                {movie.title}
                {movie.year && (
                  <span className="text-base text-text-secondary font-normal ml-2">
                    ({movie.year})
                  </span>
                )}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsShareOpen(true)}
                className="w-10 h-10 flex items-center justify-center border border-white/20 rounded text-white/70 hover:border-primary hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>
              {movie.rating && (
                <div className="flex items-center gap-2 ml-2">
                  {/* IMDb Rating */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg">
                    <span className="text-base font-bold text-white">
                      {movie.rating.toFixed(1)}
                    </span>
                    <span className="bg-[#F5C518] text-black text-[10px] font-bold px-1.5 py-0.5 rounded">
                      IMDb
                    </span>
                  </div>
                  {/* User Rating Button */}
                  <button
                    onClick={() => setIsRatingModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition-all active:scale-95 group"
                  >
                    <Star
                      className={clsx(
                        "w-4 h-4 transition-colors",
                        currentRating
                          ? "fill-primary text-primary"
                          : "text-white/60 group-hover:text-white",
                      )}
                    />
                    <span className="text-sm font-bold">
                      {currentRating ? `${currentRating}/10` : "Rate"}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Show Info Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 shrink-0">
                <img
                  src={posterUrl}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-base font-medium text-white">
                {movie.title}
              </span>
            </div>

            <button
              onClick={handleWatchlistClick}
              disabled={isWatchlistLoading}
              className={clsx(
                "flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                movie.inWatchlist
                  ? "bg-primary text-black hover:bg-primary/90"
                  : "border-2 border-primary text-primary hover:bg-primary hover:text-black",
              )}
            >
              {isWatchlistLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Loading...</span>
                </>
              ) : movie.inWatchlist ? (
                <>
                  <Check className="w-5 h-5 stroke-3" />
                  <span>In Watchlist</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 stroke-3" />
                  <span>Add to Watchlist</span>
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/10 my-6" />

          {/* Story Line Section */}
          <div>
            <h3 className="text-base font-bold text-white mb-3">Story line:</h3>
            <p className="text-sm md:text-base leading-relaxed text-white/80">
              {isStoryExpanded ? storyline : truncatedStoryline}
              {storyline.length > 300 && (
                <button
                  className="text-primary font-semibold ml-2 hover:underline"
                  onClick={() => setIsStoryExpanded(!isStoryExpanded)}
                >
                  {isStoryExpanded ? "Show Less" : "Read More"}
                </button>
              )}
            </p>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/10 my-6" />

          {/* Comments Section */}
          {movie.tmdbId && <CommentSection tmdbId={movie.tmdbId} />}
        </div>

        {/* Rating Modal */}
        {movie._id && (
          <MovieRating
            isOpen={isRatingModalOpen}
            onClose={() => setIsRatingModalOpen(false)}
            currentRating={currentRating}
            movieId={movie._id}
            movieTitle={movie.title}
          />
        )}

        {/* Share Modal */}
        <ShareModal
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          title="Share this movie"
        />
      </div>
    </div>
  );
}
