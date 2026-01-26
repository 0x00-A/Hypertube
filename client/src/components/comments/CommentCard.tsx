import { useState, useEffect } from 'react';
import { Pencil, Trash2, Flag, MoreVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { IComment } from '../../types/comment.types';
import { useUpdateComment } from '../../hooks/useUpdateComment';
import { useDeleteComment } from '../../hooks/useDeleteComment';
import { useAuthState } from '../../hooks/useAuth';
import { MAX_COMMENT_LENGTH } from '../../utils/constants';
import { getAvatarUrl } from '../../utils/avatarUtils';

interface CommentCardProps {
    comment: IComment;
    tmdbId: number;
}

export const CommentCard = ({ comment, tmdbId }: CommentCardProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [showMenu, setShowMenu] = useState(false);
    const { user } = useAuthState();
    const updateMutation = useUpdateComment();
    const deleteMutation = useDeleteComment();

    const [isDeletingState, setIsDeletingState] = useState(false);

    const isOwner = user?._id === comment.user._id;

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showMenu && !(event.target as Element).closest('.comment-menu-container')) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showMenu]);

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
        deleteMutation.mutate({ id: comment._id, tmdbId });
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
            <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center overflow-hidden">
                        {comment.user.avatarUrl ? (
                            <img
                                src={getAvatarUrl(comment.user.avatarUrl)}
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
                    <div className="flex items-center justify-between mb-2">
                        <Link 
                            to={`/user/${comment.user.username}`}
                            className="text-white font-semibold text-base hover:text-primary transition-colors"
                        >
                            {comment.user.username}
                        </Link>

                        <div className="flex items-center gap-3">
                            <span className="text-text-secondary text-sm">
                                {getRelativeTime(comment.createdAt)}
                            </span>

                            {/* Menu Trigger */}
                            {!isDeletingState && !isEditing && (
                                <div className="relative comment-menu-container">
                                    <button
                                        onClick={() => setShowMenu(!showMenu)}
                                        className="text-text-secondary hover:text-white transition-colors p-1"
                                    >
                                        <MoreVertical className="w-4 h-4" />
                                    </button>

                                    {/* Dropdown Menu */}
                                    {showMenu && (
                                        <div className="absolute right-0 top-full mt-1 w-32 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-10 overflow-hidden">
                                            {isOwner ? (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            setIsEditing(true);
                                                            setShowMenu(false);
                                                        }}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-white/5 hover:text-white transition-colors text-left"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setIsDeletingState(true);
                                                            setShowMenu(false);
                                                        }}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-white/5 hover:text-red-500 transition-colors text-left"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                        Delete
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => setShowMenu(false)}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-white/5 hover:text-white transition-colors text-left"
                                                >
                                                    <Flag className="w-3.5 h-3.5" />
                                                    Report
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {isEditing ? (
                        <div className="space-y-3">
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                maxLength={MAX_COMMENT_LENGTH}
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
                    ) : isDeletingState ? (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                            <p className="text-sm text-red-200 mb-3">Are you sure you want to delete this comment?</p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleDelete}
                                    disabled={deleteMutation.isPending}
                                    className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-md transition-colors disabled:opacity-50"
                                >
                                    {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                                </button>
                                <button
                                    onClick={() => setIsDeletingState(false)}
                                    disabled={deleteMutation.isPending}
                                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold rounded-md transition-colors disabled:opacity-50"
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
