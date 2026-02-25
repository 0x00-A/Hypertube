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
  AlertTriangle,
} from "lucide-react";
import { clsx } from "clsx";
import { useAuthState } from "../../hooks/useAuth";
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
  // If ID is purely numeric, it's a TMDB ID; otherwise it's a MongoDB ObjectId
  const isTmdbMovie =
    location.state?.isTmdbMovie ?? (id ? /^\d+$/.test(id) : false);
  const { user } = useAuthState();
  const userLanguage = user?.language || "en";
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
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);
  const [activeCueText, setActiveCueText] = useState<string>("");
  const [streamError, setStreamError] = useState<string | null>(null);

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

    // Poll for subtitles — they're fetched in the background after the torrent
    // engine becomes ready, so they may not be available on the first request.
    // Keep polling until the user's preferred language track is available.
    let cancelled = false;
    let retries = 0;
    const MAX_RETRIES = 10;
    const POLL_INTERVAL = 3_000; // 3 seconds

    const fetchSubtitles = () => {
      streamingService
        .getStreamStatus(movieId)
        .then((status) => {
          if (cancelled) return;
          // Only collect subtitle tracks for the user's preferred language
          const tracks: ISubtitleTrack[] = [];
          const langSubs = status.subtitles[userLanguage];
          if (langSubs) {
            for (const sub of langSubs) {
              if (sub.url) {
                tracks.push(sub);
              }
            }
          }
          // Update tracks (may be empty if preferred language has no subs)
          setSubtitleTracks(tracks);
          // Keep polling if the user's preferred language isn't available yet
          const hasPreferredLang = tracks.some(
            (t) => t.language === userLanguage,
          );
          if (!hasPreferredLang && retries < MAX_RETRIES) {
            retries++;
            setTimeout(fetchSubtitles, POLL_INTERVAL);
          }
        })
        .catch(() => {
          if (!cancelled && retries < MAX_RETRIES) {
            retries++;
            setTimeout(fetchSubtitles, POLL_INTERVAL);
          }
        });
    };

    fetchSubtitles();

    return () => {
      cancelled = true;
    };
  }, [movieId, userLanguage]);

  // ========================================================================
  // Programmatically manage subtitle tracks on the <video> element
  // ========================================================================

  useEffect(() => {
    const video = videoRef.current;
    if (!video || subtitleTracks.length === 0) return;

    // Remove any existing <track> elements we previously added
    const existingTracks = video.querySelectorAll("track[data-managed]");
    existingTracks.forEach((t) => t.remove());

    // Only use subtitles in the user's preferred language — no fallback
    const preferredTrack = subtitleTracks.find(
      (t) => t.language === userLanguage,
    );

    if (!preferredTrack) return;

    // Add only the preferred subtitle as a <track> element
    const trackEl = document.createElement("track");
    trackEl.kind = "subtitles";
    trackEl.label = preferredTrack.label;
    trackEl.srclang = preferredTrack.language;
    trackEl.src = `${BACKEND_ORIGIN}${preferredTrack.url}`;
    trackEl.setAttribute("data-managed", "true");
    video.appendChild(trackEl);

    // Store cuechange handlers for cleanup
    const cueChangeHandlers: Array<{ track: TextTrack; handler: () => void }> =
      [];

    // Set track to 'hidden' (loads cues but no native rendering)
    // and attach cuechange listener when subtitles are enabled
    for (let i = 0; i < video.textTracks.length; i++) {
      const tt = video.textTracks[i];
      tt.mode = "hidden";

      if (subtitlesEnabled && tt.language === preferredTrack.language) {
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
  }, [subtitleTracks, subtitlesEnabled, userLanguage]);

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

  const handleVideoError = () => {
    setIsBuffering(false);
    setStreamError(
      "This movie is not available for streaming. It may not have any torrent sources.",
    );
  };

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

  const toggleSubtitles = () => {
    setSubtitlesEnabled((prev) => {
      if (prev) setActiveCueText("");
      return !prev;
    });
  };

  // Handle watchlist toggle
  const handleWatchlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!movie?._id) return;

    if (movie.inWatchlist) {
      removeFromWatchlist(movie._id);
    } else {
      addToWatchlist({ id: movie._id, isTmdbMovie: false });
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
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-2 sm:py-6">
        {/* Video Player Section */}
        <div
          ref={videoContainerRef}
          className="relative w-full aspect-video bg-black rounded-lg sm:rounded-xl overflow-hidden border border-primary/20 sm:border-2 sm:border-primary/30 cursor-pointer group"
          onMouseMove={() => setShowControls(true)}
          onTouchStart={() => setShowControls(true)}
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
              onError={handleVideoError}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
          )}

          {/* Stream error overlay */}
          {streamError && (
            <div
              className="absolute inset-0 flex items-center justify-center bg-black z-99"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center gap-4 max-w-md text-center px-6">
                <AlertTriangle className="w-14 h-14 text-yellow-500" />
                <p className="text-white text-lg font-medium">{streamError}</p>
                <button
                  onClick={() => navigate("/movies")}
                  className="px-5 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg transition-colors"
                >
                  Back to Movies
                </button>
              </div>
            </div>
          )}

          {/* Buffering indicator */}
          {isBuffering && !streamError && streamUrl && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
            </div>
          )}

          {/* Play button overlay when paused and not buffering */}
          {!isPlaying && !isBuffering && !streamError && streamUrl && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="w-20 h-20 rounded-full bg-black/50 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:border-primary">
                <Play className="w-10 h-10 text-white fill-white ml-1" />
              </div>
            </div>
          )}

          {/* Custom Subtitle Overlay */}
          {activeCueText && (
            <div
              className={clsx(
                "absolute left-0 right-0 flex justify-center pointer-events-none px-2 sm:px-8",
                showControls
                  ? "bottom-16 sm:bottom-20" // Above visible controls
                  : "bottom-4 sm:bottom-6", // Close to bottom when controls hidden
              )}
            >
              <span className="bg-black/75 text-white text-[13px] sm:text-base md:text-lg px-2 py-0.5 sm:px-3 sm:py-1.5 rounded text-center leading-snug whitespace-pre-line max-w-[95%] sm:max-w-[80%]">
                {activeCueText}
              </span>
            </div>
          )}

          {/* Video Controls */}
          <div
            className={clsx(
              "absolute bottom-0 left-0 right-0 px-3 pb-2 pt-3 sm:px-4 sm:pb-3 sm:pt-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent transition-opacity duration-300",
              showControls ? "opacity-100" : "opacity-0 pointer-events-none",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Progress Bar */}
            <div
              className="w-full py-1 sm:py-1.5 cursor-pointer group/progress touch-none"
              onClick={handleProgressClick}
            >
              <div className="w-full h-0.5 sm:h-1 bg-white/20 rounded-full relative group-hover/progress:h-1.5 transition-all">
                {/* Buffered bar */}
                <div
                  className="absolute h-full bg-white/30 rounded-full transition-all"
                  style={{ width: `${bufferedPercent}%` }}
                />
                {/* Progress bar */}
                <div
                  className="absolute h-full bg-primary rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
                {/* Scrub handle */}
                <div
                  className="absolute w-3 h-3 sm:w-3 sm:h-3 bg-primary rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-lg"
                  style={{
                    left: `${progressPercent}%`,
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                  }}
                />
              </div>
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between mt-1 sm:mt-2">
              {/* Left: Play + Time */}
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  className="w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center rounded-full sm:rounded text-white bg-white/10 sm:bg-transparent hover:bg-white/20 active:bg-white/30 transition-colors"
                  onClick={togglePlay}
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 sm:w-6 sm:h-6" />
                  ) : (
                    <Play className="w-5 h-5 sm:w-6 sm:h-6 ml-0.5" />
                  )}
                </button>

                <span className="text-[11px] sm:text-sm text-white/80 tabular-nums">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>

                {/* Volume controls - Desktop only */}
                <div className="hidden md:flex items-center group/vol">
                  <button
                    className="w-9 h-9 flex items-center justify-center rounded text-white hover:bg-white/10 hover:text-primary transition-colors"
                    onClick={toggleMute}
                    aria-label={isMuted ? "Unmute" : "Mute"}
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
                      aria-label="Volume"
                    />
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-0.5 sm:gap-2">
                {/* Volume - Mobile only */}
                <button
                  className="md:hidden w-9 h-9 flex items-center justify-center rounded text-white/70 active:text-white transition-colors"
                  onClick={toggleMute}
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>

                {/* Subtitles */}
                <button
                  className={clsx(
                    "w-9 h-9 flex items-center justify-center rounded transition-colors",
                    subtitlesEnabled && subtitleTracks.length > 0
                      ? "text-primary"
                      : "text-white/70 active:text-white sm:hover:bg-white/10 sm:hover:text-primary",
                  )}
                  onClick={toggleSubtitles}
                  title={
                    subtitleTracks.length === 0
                      ? "No subtitles available"
                      : subtitlesEnabled
                        ? "Turn off subtitles"
                        : "Turn on subtitles"
                  }
                  disabled={subtitleTracks.length === 0}
                  aria-label="Toggle subtitles"
                >
                  <Subtitles className="w-5 h-5" />
                </button>

                {/* Fullscreen */}
                <button
                  className="w-9 h-9 flex items-center justify-center rounded text-white/70 active:text-white sm:hover:bg-white/10 sm:hover:text-primary transition-colors"
                  onClick={toggleFullscreen}
                  aria-label={
                    isFullscreen ? "Exit fullscreen" : "Enter fullscreen"
                  }
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
        <div className="mt-3 sm:mt-6 px-2 sm:px-0">
          {/* Title Row */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                {movie.title}
                {movie.year && (
                  <span className="text-sm sm:text-base text-text-secondary font-normal ml-2">
                    ({movie.year})
                  </span>
                )}
              </h1>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setIsShareOpen(true)}
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center border border-white/20 rounded text-white/70 hover:border-primary hover:text-primary hover:bg-primary/10 active:bg-primary/20 transition-colors"
                aria-label="Share"
              >
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              {movie.rating && (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* IMDb Rating */}
                  <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white/5 rounded-lg">
                    <span className="text-sm sm:text-base font-bold text-white">
                      {movie.rating.toFixed(1)}
                    </span>
                    <span className="bg-[#F5C518] text-black text-[9px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.5 rounded">
                      IMDb
                    </span>
                  </div>
                  {/* User Rating Button */}
                  <button
                    onClick={() => setIsRatingModalOpen(true)}
                    className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 active:bg-white/20 transition-all active:scale-95 group"
                    aria-label="Rate movie"
                  >
                    <Star
                      className={clsx(
                        "w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors",
                        currentRating
                          ? "fill-primary text-primary"
                          : "text-white/60 group-hover:text-white",
                      )}
                    />
                    <span className="text-xs sm:text-sm font-bold">
                      {currentRating ? `${currentRating}/10` : "Rate"}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Show Info Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-white/20 shrink-0">
                <img
                  src={posterUrl}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-sm sm:text-base font-medium text-white line-clamp-1">
                {movie.title}
              </span>
            </div>

            <button
              onClick={handleWatchlistClick}
              disabled={isWatchlistLoading}
              className={clsx(
                "flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg font-semibold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto",
                movie.inWatchlist
                  ? "bg-primary text-black hover:bg-primary/90 active:bg-primary/80"
                  : "border-2 border-primary text-primary hover:bg-primary hover:text-black active:bg-primary/90",
              )}
              aria-label={
                movie.inWatchlist ? "Remove from watchlist" : "Add to watchlist"
              }
            >
              {isWatchlistLoading ? (
                <>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Loading...</span>
                </>
              ) : movie.inWatchlist ? (
                <>
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-3" />
                  <span>In Watchlist</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-3" />
                  <span>Add to Watchlist</span>
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/10 my-4 sm:my-6" />

          {/* Story Line Section */}
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white mb-2 sm:mb-3">
              Story line:
            </h3>
            <p className="text-sm sm:text-base leading-relaxed text-white/80">
              {isStoryExpanded ? storyline : truncatedStoryline}
              {storyline.length > 300 && (
                <button
                  className="text-primary font-semibold ml-2 hover:underline active:underline text-sm sm:text-base"
                  onClick={() => setIsStoryExpanded(!isStoryExpanded)}
                  aria-label={isStoryExpanded ? "Show less" : "Read more"}
                >
                  {isStoryExpanded ? "Show Less" : "Read More"}
                </button>
              )}
            </p>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/10 my-4 sm:my-6" />

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
