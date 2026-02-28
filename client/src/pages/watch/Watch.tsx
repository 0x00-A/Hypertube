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
  X,
  RotateCcw,
  ArrowLeft,
} from "lucide-react";
import { clsx } from "clsx";
import { useAuthState } from "../../hooks/useAuth";
import { useMovieDetails } from "../../hooks/useMovieDetails";
import {
  useAddToWatchlist,
  useRemoveFromWatchlist,
} from "../../hooks/useMovieInteractions";
import { useUserRating } from "../../hooks/useUserRating";
import { useUpdateWatchProgress } from "../../hooks/useUpdateWatchProgress";
import { CommentSection } from "../../components/comments";
import { MovieRating } from "../../components/movie";
import ShareModal from "../../components/common/ShareModal";
import { streamingService } from "../../services/streaming.service";
import { movieInteractionService } from "../../services/movieInteraction.service";
import type {
  ISubtitleTrack,
  IAvailableSubtitles,
} from "../../types/movie.types";

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

  // Watch progress mutation
  const updateWatchProgressMutation = useUpdateWatchProgress();

  // Video element ref
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<number | null>(null);
  const progressSaveRef = useRef<number | null>(null);
  const lastSavedTimeRef = useRef<number>(0);
  const subtitleControlsRef = useRef<HTMLButtonElement>(null);
  const subtitlePanelRef = useRef<HTMLDivElement>(null);

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
  // Subtitle state
  const [availableSubtitles, setAvailableSubtitles] =
    useState<IAvailableSubtitles>({});
  const [selectedSubtitleLanguage, setSelectedSubtitleLanguage] = useState<
    string | null
  >(null);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false);
  const [activeCueText, setActiveCueText] = useState<string>("");
  const [isSubtitlePanelOpen, setIsSubtitlePanelOpen] = useState(false);

  const [isMobileVolumeHovered, setIsMobileVolumeHovered] = useState(false);
  const [subtitleOffset, setSubtitleOffset] = useState(() => {
    // Initialize from localStorage if movieId is available
    // const urlParams = new URLSearchParams(window.location.search);
    const pathMovieId = window.location.pathname.split("/").pop();
    if (pathMovieId) {
      const saved = localStorage.getItem(`subtitle-timing-${pathMovieId}`);
      return saved ? parseInt(saved) : 0;
    }
    return 0;
  }); // milliseconds
  const [currentTextTrack, setCurrentTextTrack] = useState<TextTrack | null>(
    null,
  );
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
    // Keep polling until all expected language tracks are available.
    let cancelled = false;
    let retries = 0;
    const MAX_RETRIES = 15; // Increased retries for multi-language
    const POLL_INTERVAL = 3_000; // 3 seconds

    const fetchSubtitles = () => {
      streamingService
        .getStreamStatus(movieId)
        .then((status) => {
          if (cancelled) return;

          // Collect English and user language subtitles
          const available: IAvailableSubtitles = {
            userLanguageCode: userLanguage,
          };

          // Check for English subtitles
          const englishSubs = status.subtitles["en"];
          if (englishSubs && englishSubs.length > 0) {
            available.english = englishSubs.filter((sub) => sub.url);
          }

          // Check for user language subtitles (if different from English)
          if (userLanguage !== "en") {
            const userLangSubs = status.subtitles[userLanguage];
            if (userLangSubs && userLangSubs.length > 0) {
              available.userLanguage = userLangSubs.filter((sub) => sub.url);
            }
          }

          setAvailableSubtitles(available);

          // Continue polling until we have all expected subtitle languages
          const needsEnglish = true; // Always try to get English
          const needsUserLang = userLanguage !== "en"; // Only if different from English

          const hasEnglish = !!available.english;
          const hasUserLang = !!available.userLanguage || userLanguage === "en"; // Don't need user lang if it's English

          const hasAllExpectedSubtitles =
            (!needsEnglish || hasEnglish) && (!needsUserLang || hasUserLang);

          if (!hasAllExpectedSubtitles && retries < MAX_RETRIES) {
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

    // Start fetching immediately
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
    if (!video) return;

    // Remove any existing <track> elements we previously added
    const existingTracks = video.querySelectorAll("track[data-managed]");
    existingTracks.forEach((t) => t.remove());

    // Only create tracks if subtitles are enabled and a language is selected
    if (!subtitlesEnabled || !selectedSubtitleLanguage) {
      setCurrentTextTrack(null);
      return;
    }

    // Get the selected track
    let selectedTrack: ISubtitleTrack | undefined;
    if (selectedSubtitleLanguage?.startsWith("en-") && availableSubtitles.english) {
      const idx = parseInt(selectedSubtitleLanguage.split("-")[1], 10);
      selectedTrack = availableSubtitles.english[idx] || availableSubtitles.english[0];
    } else if (
      selectedSubtitleLanguage?.startsWith(`${availableSubtitles.userLanguageCode}-`) &&
      availableSubtitles.userLanguage
    ) {
      const idx = parseInt(selectedSubtitleLanguage.split("-")[1], 10);
      selectedTrack = availableSubtitles.userLanguage[idx] || availableSubtitles.userLanguage[0];
    }

    if (!selectedTrack) {
      setCurrentTextTrack(null);
      return;
    }

    // Add the selected subtitle as a <track> element
    const trackEl = document.createElement("track");
    trackEl.kind = "subtitles";
    trackEl.label = selectedTrack.label;
    trackEl.srclang = selectedTrack.language;
    trackEl.src = `${BACKEND_ORIGIN}${selectedTrack.url}`;
    trackEl.setAttribute("data-managed", "true");
    video.appendChild(trackEl);

    // Store cuechange handlers for cleanup
    const cueChangeHandlers: Array<{ track: TextTrack; handler: () => void }> =
      [];

    // Set track to 'hidden' (loads cues but no native rendering)
    // Store the current track for subtitle timing in handleTimeUpdate
    for (let i = 0; i < video.textTracks.length; i++) {
      const tt = video.textTracks[i];
      tt.mode = "hidden";

      if (tt.language === selectedTrack.language) {
        // Store the current track for subtitle timing
        setCurrentTextTrack(tt);

        // Simple handler just to keep track of cue changes
        const handler = () => {
          // Subtitle timing is now handled in handleTimeUpdate
        };
        tt.addEventListener("cuechange", handler);
        cueChangeHandlers.push({ track: tt, handler });
      }
    }

    return () => {
      cueChangeHandlers.forEach(({ track, handler }) => {
        track.removeEventListener("cuechange", handler);
      });
      setCurrentTextTrack(null);
    };
  }, [
    availableSubtitles,
    subtitlesEnabled,
    selectedSubtitleLanguage,
    subtitleOffset,
  ]);

  // ========================================================================
  // Subtitle timing persistence
  // ========================================================================

  // Load saved subtitle offset when movie changes (initial load handled in useState)
  useEffect(() => {
    if (movieId) {
      const saved = localStorage.getItem(`subtitle-timing-${movieId}`);
      const savedOffset = saved ? parseInt(saved) : 0;
      // Only update if different from current value to avoid unnecessary rerenders
      setSubtitleOffset((prev) => (prev !== savedOffset ? savedOffset : prev));
    }
  }, [movieId]); // Removed movie dependency as it's not needed for this

  // Save subtitle offset changes
  useEffect(() => {
    if (movieId) {
      localStorage.setItem(
        `subtitle-timing-${movieId}`,
        String(subtitleOffset),
      );
    }
  }, [subtitleOffset, movieId]);

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
    updateWatchProgressMutation.mutate({
      movieId,
      lastWatchedPosition: video.currentTime,
      duration: video.duration,
    });
  }, [movieId, updateWatchProgressMutation]);

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
    if (
      showControls &&
      isPlaying &&
      !isSubtitlePanelOpen &&
      !isMobileVolumeHovered
    ) {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = window.setTimeout(() => {
        setShowControls(false);
      }, CONTROLS_AUTO_HIDE_DELAY);
    }
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [showControls, isPlaying, isSubtitlePanelOpen, isMobileVolumeHovered]);

  // Close subtitle panel and volume UI when controls hide
  useEffect(() => {
    if (!showControls) {
      setIsSubtitlePanelOpen(false);
      setIsMobileVolumeHovered(false);
    }
  }, [showControls]);

  // Close subtitle panel on click outside
  useEffect(() => {
    if (!isSubtitlePanelOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        subtitlePanelRef.current &&
        !subtitlePanelRef.current.contains(e.target as Node) &&
        subtitleControlsRef.current &&
        !subtitleControlsRef.current.contains(e.target as Node)
      ) {
        setIsSubtitlePanelOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSubtitlePanelOpen]);

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

    // Handle subtitle timing with offset
    if (
      currentTextTrack &&
      subtitlesEnabled &&
      currentTextTrack.cues &&
      currentTextTrack.cues.length > 0
    ) {
      const currentTime = video.currentTime;

      // Apply subtitle offset - VLC style: positive delays, negative advances
      const adjustedCurrentTime = currentTime - subtitleOffset / 1000;

      // Find cues that should be active with timing offset applied
      const texts: string[] = [];
      for (let j = 0; j < currentTextTrack.cues.length; j++) {
        const cue = currentTextTrack.cues[j] as VTTCue;

        if (
          adjustedCurrentTime >= cue.startTime &&
          adjustedCurrentTime <= cue.endTime
        ) {
          texts.push(cue.text);
        }
      }
      setActiveCueText(texts.join("\n"));
    } else if (!subtitlesEnabled) {
      setActiveCueText("");
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
            setCurrentTime(progress.lastWatchedPosition);
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

  // Get available subtitle language options
  const getAvailableSubtitleLanguages = () => {
    const languages: { code: string; label: string }[] = [];

    if (availableSubtitles.english) {
      availableSubtitles.english.forEach((track, i) => {
        languages.push({ code: `en-${i}`, label: track.label || `English ${i > 0 ? i + 1 : ''}` });
      });
    }

    if (
      availableSubtitles.userLanguage &&
      availableSubtitles.userLanguageCode &&
      availableSubtitles.userLanguageCode !== "en"
    ) {
      availableSubtitles.userLanguage.forEach((track, i) => {
        languages.push({
          code: `${availableSubtitles.userLanguageCode}-${i}`,
          label: track.label || `${availableSubtitles.userLanguageCode!.toUpperCase()} ${i > 0 ? i + 1 : ''}`,
        });
      });
    }

    return languages;
  };

  const availableLanguages = getAvailableSubtitleLanguages();
  const hasSubtitles = availableLanguages.length > 0;


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
            onClick={() => navigate("/library")}
            className="text-primary hover:underline"
          >
            Back to Library
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
        {/* Back Button */}
        <div className="mb-3 sm:mb-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20 active:scale-95 transition-all duration-200 text-xs sm:text-sm font-medium"
            aria-label="Go back"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Back</span>
          </button>
        </div>

        {/* Video Player Section */}
        <div className="relative">
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
              className="absolute inset-0 flex items-center justify-center bg-black z-40"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center gap-4 max-w-md text-center px-6">
                <AlertTriangle className="w-14 h-14 text-yellow-500" />
                <p className="text-white text-lg font-medium">{streamError}</p>
                <button
                  onClick={() => navigate("/library")}
                  className="px-5 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg transition-colors"
                >
                  Back to Library
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
              <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-full bg-black/50 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:border-primary">
                <Play className="w-6 h-6 sm:w-10 sm:h-10 text-white fill-white ml-0.5 sm:ml-1" />
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
              "absolute bottom-0 left-0 right-0 px-3 pb-2 pt-3 sm:px-4 sm:pb-3 sm:pt-4 bg-linear-to-t from-black/95 via-black/60 to-transparent transition-opacity duration-300",
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
            <div className="flex items-center justify-between mt-1 sm:mt-2 gap-2">
              {/* Left: Play + Time + Desktop Volume */}
              <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                {/* Play/Pause */}
                <button
                  className="w-7 h-7 sm:w-9 sm:h-9 shrink-0 flex items-center justify-center rounded-full text-white bg-white/10 hover:bg-white/20 active:bg-white/30 transition-colors"
                  onClick={togglePlay}
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                  ) : (
                    <Play className="w-3.5 h-3.5 sm:w-5 sm:h-5 ml-0.5" />
                  )}
                </button>

                {/* Time */}
                <span className="text-[10px] sm:text-xs text-white/80 tabular-nums shrink-0 whitespace-nowrap">
                  {formatTime(currentTime)}
                  <span className="text-white/40"> / </span>
                  {formatTime(duration)}
                </span>

                {/* Volume – Desktop */}
                <div className="hidden md:flex items-center group/vol shrink-0">
                  <button
                    className="w-8 h-8 flex items-center justify-center rounded text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                    onClick={toggleMute}
                    aria-label={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                  <div className="w-0 overflow-hidden group-hover/vol:w-20 transition-all duration-200">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-20 ml-1 accent-primary cursor-pointer"
                      aria-label="Volume"
                    />
                  </div>
                </div>
              </div>

              {/* Right: Volume (mobile) + CC + Fullscreen */}
              <div className="flex items-center gap-0.5 shrink-0">
                {/* Volume – Mobile tap-to-mute only (slider is too cramped) */}
                <button
                  className="md:hidden w-9 h-9 flex items-center justify-center rounded text-white/70 active:text-white hover:bg-white/10 transition-colors"
                  onClick={toggleMute}
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>

                {/* Subtitle Panel Trigger */}
                {hasSubtitles && (
                  <button
                    ref={subtitleControlsRef}
                    className={clsx(
                      "w-9 h-9 flex items-center justify-center rounded transition-colors relative",
                      isSubtitlePanelOpen || subtitlesEnabled
                        ? "text-primary bg-primary/15"
                        : "text-white/70 hover:bg-white/10 hover:text-white",
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSubtitlePanelOpen((p) => !p);
                      setShowControls(true);
                    }}
                    aria-label="Subtitle settings"
                    aria-expanded={isSubtitlePanelOpen}
                    aria-haspopup="dialog"
                  >
                    <Subtitles className="w-4 h-4 sm:w-5 sm:h-5" />
                    {subtitlesEnabled && (
                      <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </button>
                )}

                {/* Fullscreen */}
                <button
                  className="w-9 h-9 flex items-center justify-center rounded text-white/70 hover:bg-white/10 hover:text-white active:text-white transition-colors"
                  onClick={toggleFullscreen}
                  aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                  {isFullscreen ? (
                    <Minimize className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ── Subtitle Settings Panel (fullscreen only) ─────── */}
          {isFullscreen && hasSubtitles && isSubtitlePanelOpen && (
            <div
              ref={subtitlePanelRef}
              className="absolute bottom-14 sm:bottom-16 right-2 sm:right-3 w-[min(272px,calc(100%-1rem))] bg-zinc-900/95 backdrop-blur-xl border border-white/12 rounded-2xl shadow-2xl z-20 overflow-hidden"
              role="dialog"
              aria-label="Subtitle settings"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Panel header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <span className="text-sm font-semibold text-white tracking-tight">Subtitles</span>
                <button
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                  onClick={() => setIsSubtitlePanelOpen(false)}
                  aria-label="Close subtitle settings"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Language list */}
              <div className="px-2 py-2">
                <p className="text-[10px] uppercase tracking-widest text-white/35 font-semibold mb-1.5 px-2">Language</p>
                {/* Off */}
                <button
                  className={clsx(
                    "flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm transition-colors text-left",
                    !subtitlesEnabled
                      ? "bg-primary/15 text-primary"
                      : "text-white/65 hover:bg-white/8 hover:text-white",
                  )}
                  onClick={() => {
                    setSubtitlesEnabled(false);
                    setSelectedSubtitleLanguage(null);
                    setActiveCueText("");
                  }}
                >
                  <span
                    className={clsx(
                      "w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center",
                      !subtitlesEnabled ? "border-primary" : "border-white/25",
                    )}
                  >
                    {!subtitlesEnabled && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </span>
                  Off
                </button>

                {/* Language options */}
                {availableLanguages.map((lang) => {
                  const isSelected =
                    subtitlesEnabled && selectedSubtitleLanguage === lang.code;
                  return (
                    <button
                      key={lang.code}
                      className={clsx(
                        "flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm transition-colors text-left",
                        isSelected
                          ? "bg-primary/15 text-primary"
                          : "text-white/65 hover:bg-white/8 hover:text-white",
                      )}
                      onClick={() => {
                        setSubtitlesEnabled(true);
                        setSelectedSubtitleLanguage(lang.code);
                      }}
                    >
                      <span
                        className={clsx(
                          "w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center",
                          isSelected ? "border-primary" : "border-white/25",
                        )}
                      >
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                      </span>
                      {lang.label}
                    </button>
                  );
                })}
              </div>

              {/* Timing offset – shown only when a language is active */}
              {subtitlesEnabled && selectedSubtitleLanguage && (
                <>
                  <div className="h-px bg-white/10 mx-3" />
                  <div className="px-3 py-3">
                    <p className="text-[10px] uppercase tracking-widest text-white/35 font-semibold mb-2 px-1">Sync offset</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={subtitleOffset}
                        onChange={(e) =>
                          setSubtitleOffset(parseInt(e.target.value) || 0)
                        }
                        className="flex-1 bg-white/8 text-sm text-white text-center border border-white/12 rounded-lg px-2 py-1.5 focus:border-primary focus:outline-none focus:bg-white/12 transition-colors appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-moz-appearance:textfield]"
                        step={50}
                        min={-20000}
                        max={20000}
                        placeholder="0"
                        aria-label="Subtitle timing offset in milliseconds"
                        title="+ms delays · −ms advances"
                      />
                      <span className="text-xs text-white/40 shrink-0">ms</span>
                      <button
                        onClick={() => setSubtitleOffset(0)}
                        className={clsx(
                          "w-8 h-8 shrink-0 flex items-center justify-center rounded-lg transition-colors",
                          subtitleOffset !== 0
                            ? "text-white/60 hover:text-white hover:bg-white/10"
                            : "text-white/20 cursor-default",
                        )}
                        disabled={subtitleOffset === 0}
                        aria-label="Reset subtitle offset"
                        title="Reset timing"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[10px] text-white/30 mt-1.5 px-1">+ delays · − advances subtitles</p>
                  </div>
                </>
              )}

            </div>
          )}
        </div>
        {/* ── Subtitle Settings Panel (normal / non-fullscreen) ── */}
        {!isFullscreen && hasSubtitles && isSubtitlePanelOpen && (
          <div
            ref={subtitlePanelRef}
            className="absolute bottom-11 sm:bottom-16 right-1.5 sm:right-3 w-[min(190px,calc(100%-0.75rem))] sm:w-[min(240px,calc(100%-1.5rem))] bg-zinc-900/95 backdrop-blur-xl border border-white/12 rounded-lg sm:rounded-2xl shadow-2xl z-20"
            role="dialog"
            aria-label="Subtitle settings"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-2.5 py-1.5 sm:px-4 sm:py-3 border-b border-white/10">
              <span className="text-[11px] sm:text-sm font-semibold text-white tracking-tight">Subtitles</span>
              <button
                className="w-5 h-5 sm:w-7 sm:h-7 flex items-center justify-center rounded text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                onClick={() => setIsSubtitlePanelOpen(false)}
                aria-label="Close subtitle settings"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>

            {/* Language list */}
            <div className="px-1 py-0.5 sm:px-2 sm:py-2">
              {/* Off */}
              <button
                className={clsx(
                  "flex items-center gap-2 w-full px-2 py-1 sm:px-3 sm:py-2 rounded sm:rounded-xl text-[11px] sm:text-sm transition-colors text-left",
                  !subtitlesEnabled
                    ? "bg-primary/15 text-primary"
                    : "text-white/65 hover:bg-white/8 hover:text-white",
                )}
                onClick={() => {
                  setSubtitlesEnabled(false);
                  setSelectedSubtitleLanguage(null);
                  setActiveCueText("");
                }}
              >
                <span
                  className={clsx(
                    "w-3 h-3 rounded-full border-2 shrink-0 flex items-center justify-center",
                    !subtitlesEnabled ? "border-primary" : "border-white/25",
                  )}
                >
                  {!subtitlesEnabled && <span className="w-1 h-1 rounded-full bg-primary" />}
                </span>
                Off
              </button>

              {/* Language options */}
              {availableLanguages.map((lang) => {
                const isSelected = subtitlesEnabled && selectedSubtitleLanguage === lang.code;
                return (
                  <button
                    key={lang.code}
                    className={clsx(
                      "flex items-center gap-2 w-full px-2 py-1 sm:px-3 sm:py-2 rounded sm:rounded-xl text-[11px] sm:text-sm transition-colors text-left",
                      isSelected
                        ? "bg-primary/15 text-primary"
                        : "text-white/65 hover:bg-white/8 hover:text-white",
                    )}
                    onClick={() => {
                      setSubtitlesEnabled(true);
                      setSelectedSubtitleLanguage(lang.code);
                    }}
                  >
                    <span
                      className={clsx(
                        "w-3 h-3 rounded-full border-2 shrink-0 flex items-center justify-center",
                        isSelected ? "border-primary" : "border-white/25",
                      )}
                    >
                      {isSelected && <span className="w-1 h-1 rounded-full bg-primary" />}
                    </span>
                    {lang.label}
                  </button>
                );
              })}
            </div>

            {/* Sync offset */}
            {subtitlesEnabled && selectedSubtitleLanguage && (
              <>
                <div className="h-px bg-white/10 mx-2 sm:mx-3" />
                <div className="px-2 py-1.5 sm:px-3 sm:py-3">
                  <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-white/35 font-semibold mb-1">Sync (ms)</p>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={subtitleOffset}
                      onChange={(e) => setSubtitleOffset(parseInt(e.target.value) || 0)}
                      className="flex-1 min-w-0 bg-white/8 text-[11px] sm:text-sm text-white text-center border border-white/12 rounded px-1 py-0.5 sm:px-2 sm:py-1.5 focus:border-primary focus:outline-none transition-colors"
                      step={50}
                      min={-20000}
                      max={20000}
                      placeholder="0"
                      aria-label="Subtitle timing offset in milliseconds"
                    />
                    <button
                      onClick={() => setSubtitleOffset(0)}
                      disabled={subtitleOffset === 0}
                      className={clsx(
                        "w-6 h-6 sm:w-7 sm:h-7 shrink-0 flex items-center justify-center rounded transition-colors",
                        subtitleOffset !== 0
                          ? "text-white/60 hover:text-white hover:bg-white/10"
                          : "text-white/20 cursor-default",
                      )}
                      aria-label="Reset subtitle offset"
                    >
                      <RotateCcw className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                    </button>
                  </div>
                </div>
              </>
            )}

          </div>
        )}
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
