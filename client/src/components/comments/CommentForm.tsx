import { useState } from 'react';
import { Send } from 'lucide-react';
import { clsx } from 'clsx';
import { useCreateComment } from '../../hooks/useCreateComment';

interface CommentFormProps {
    tmdbId: number;
}

export const CommentForm = ({ tmdbId }: CommentFormProps) => {
    const [content, setContent] = useState('');
    const createMutation = useCreateComment();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (content.trim()) {
            createMutation.mutate(
                { content: content.trim(), tmdbId },
                {
                    onSuccess: () => setContent(''),
                }
            );
        }
    };

    const remainingChars = 500 - content.length;

    return (
        <form onSubmit={handleSubmit} className="bg-card border border-white/10 rounded-xl p-4 sm:p-6">
            <h3 className="text-white font-semibold text-base sm:text-lg mb-4">
                Post a comment for this movie:
            </h3>

            <div className="space-y-4">
                <div className="relative">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Share your thoughts..."
                        maxLength={500}
                        className="w-full bg-background border border-primary/30 rounded-lg px-4 py-3 text-white placeholder-text-muted focus:outline-none focus:border-primary resize-none min-h-[120px]"
                        disabled={createMutation.isPending}
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-text-secondary">
                        {remainingChars}
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-text-secondary">
                        <span className={clsx(remainingChars < 0 && 'text-red-500')}>
                            {content.length}/500
                        </span>
                    </div>

                    <button
                        type="submit"
                        disabled={createMutation.isPending || !content.trim() || content.length > 500}
                        className={clsx(
                            'flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base transition-all',
                            'bg-primary text-black hover:bg-primary/90',
                            'disabled:opacity-50 disabled:cursor-not-allowed',
                            'active:scale-95'
                        )}
                    >
                        <Send className="w-4 h-4" />
                        {createMutation.isPending ? 'Posting...' : 'Submit Comment'}
                    </button>
                </div>

                {createMutation.isError && (
                    <div className="text-red-500 text-sm">
                        Failed to post comment. Please try again.
                    </div>
                )}
            </div>
        </form>
    );
};
