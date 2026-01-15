/**
 * ShareModal - Reusable Share Modal Component
 * 
 * A centered modal for sharing URLs with copy functionality.
 * Can be used across different pages.
 */

import { Copy, X, Link } from 'lucide-react';
import toast from 'react-hot-toast';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    url?: string;
    title?: string;
}

export default function ShareModal({ isOpen, onClose, url, title = 'Share' }: ShareModalProps) {
    const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            toast.success('Link copied to clipboard!');
            onClose();
        } catch {
            toast.error('Failed to copy link');
        }
    };

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
        >
            <div className="w-full max-w-md mx-4 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-[#1f1f1f] to-[#252525] border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center bg-primary/20 rounded-full ring-2 ring-primary/30">
                            <Link className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold text-white">{title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 bg-[#141414]">
                    <p className="text-sm text-white/60 mb-4">
                        Copy the link below to share this page
                    </p>
                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            readOnly
                            value={shareUrl}
                            className="flex-1 bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 truncate focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-colors"
                        />
                        <button
                            onClick={handleCopyLink}
                            className="flex items-center gap-2 px-5 py-3 bg-primary text-black font-semibold rounded-xl hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20"
                        >
                            <Copy className="w-4 h-4" />
                            Copy
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
