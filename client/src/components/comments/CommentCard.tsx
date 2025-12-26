import { useState } from 'react';
import { Pencil, Trash2, Flag } from 'lucide-react';
import type { IComment } from '../../types/comment.types';
import { useUpdateComment } from '../../hooks/useUpdateComment';
import { useDeleteComment } from '../../hooks/useDeleteComment';
import { useAuthState } from '../../hooks/useAuth';

interface CommentCardProps {
    comment: IComment;
    tmdbId: number;
}

export const CommentCard = ({ comment, tmdbId }: CommentCardProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const { user } = useAuthState();
    const updateMutation = useUpdateComment();
    const deleteMutation = useDeleteComment();

    const isOwner = user?._id === comment.user._id;

    const handleEdit = () => {
        if (editContent.trim() && editContent !== comment.content) {
            updateMutation.mutate(
                { id: comment._id, content: editContent, tmdbId },
                {
                    onSuccess: () => setIsEditing(false),
                }
            );
        }
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this comment?')) {
            deleteMutation.mutate({ id: comment._id, tmdbId });
        }
    };

    const handleCancel = () => {
        setEditContent(comment.content);
        setIsEditing(false);
    };

    const getRelativeTime = (date: string) => {
        const now = new Date();
        const commentDate = new Date(date);
        const diffInSeconds = Math.floor((now.getTime() - commentDate.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
        if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
        return `${Math.floor(diffInSeconds / 31536000)} years ago`;
    };

    return (
        <div className="bg-card border border-white/10 rounded-xl p-4 sm:p-6">
            <div className="flex items-start gap-3 sm:gap-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center overflow-hidden">
                        {comment.user.avatarUrl ? (
                            <img
                                src={comment.user.avatarUrl}
                                alt={comment.user.username}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-primary font-bold text-lg">
                                {comment.user.username.charAt(0).toUpperCase()}
                            </span>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white font-semibold text-sm sm:text-base">
                                {comment.user.username}
                            </span>
                            <span className="text-text-secondary text-xs sm:text-sm">
                                {getRelativeTime(comment.createdAt)}
                            </span>
                        </div>

                        <div className="flex items-center gap-1 sm:gap-2">
                            {isOwner && !isEditing && (
                                <>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="p-1.5 sm:p-2 rounded-lg hover:bg-white/5 text-text-secondary hover:text-white transition-colors"
                                        title="Edit comment"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={deleteMutation.isPending}
                                        className="p-1.5 sm:p-2 rounded-lg hover:bg-white/5 text-text-secondary hover:text-red-500 transition-colors disabled:opacity-50"
                                        title="Delete comment"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                            {!isOwner && (
                                <button
                                    className="p-1.5 sm:p-2 rounded-lg hover:bg-white/5 text-text-secondary hover:text-primary transition-colors"
                                    title="Report comment"
                                >
                                    <Flag className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {isEditing ? (
                        <div className="space-y-3">
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                maxLength={500}
                                className="w-full bg-background border border-primary/30 rounded-lg px-4 py-3 text-white placeholder-text-muted focus:outline-none focus:border-primary resize-none"
                                rows={3}
                            />
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleEdit}
                                    disabled={updateMutation.isPending || !editContent.trim()}
                                    className="px-4 py-2 bg-primary text-black font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                >
                                    {updateMutation.isPending ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                    onClick={handleCancel}
                                    disabled={updateMutation.isPending}
                                    className="px-4 py-2 bg-white/5 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-300 text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
                            {comment.content}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
