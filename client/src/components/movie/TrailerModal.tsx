import { X } from 'lucide-react';
import { useEffect } from 'react';

interface TrailerModalProps {
    isOpen: boolean;
    onClose: () => void;
    trailerUrl?: string;
    title: string;
}

export default function TrailerModal({ isOpen, onClose, trailerUrl, title }: TrailerModalProps) {
    // Close on escape key
    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen || !trailerUrl) return null;

    // Helper to extract video ID and create embed URL
    const getEmbedUrl = (url: string) => {
        if (!url) return '';

        // Handle standard YouTube URLs
        let videoId = '';
        if (url.includes('youtube.com/watch?v=')) {
            videoId = url.split('v=')[1]?.split('&')[0];
        } else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1];
        } else if (url.includes('youtube.com/embed/')) {
            return url; // Already an embed URL
        }

        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        }

        // Return original if not recognized as YouTube (might be direct link or other provider)
        return url;
    };

    const embedUrl = getEmbedUrl(trailerUrl);

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/30 backdrop-blur-md animate-in fade-in duration-200"
            onClick={handleBackdropClick}
        >
            <div className="relative w-full max-w-5xl aspect-video mx-4 bg-black rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-black/60 hover:bg-white/20 rounded-full text-white transition-colors"
                    aria-label="Close modal"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Video Player */}
                <div className="w-full h-full">
                    <iframe
                        src={embedUrl}
                        title={`${title} Trailer`}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
            </div>
        </div>
    );
}
