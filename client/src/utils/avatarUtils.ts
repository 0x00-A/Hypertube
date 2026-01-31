/**
 * Utility functions for handling avatar URLs
 */

/**
 * Gets the full URL for an avatar
 * @param avatarPath - The avatar path from the API (e.g., /uploads/avatars/uuid.jpg)
 * @returns Full URL to the avatar image
 */
export const getAvatarUrl = (avatarPath?: string): string => {
  if (!avatarPath) return '';
  
  // If it's already a full URL (http/https), return as-is (for OAuth avatars)
  if (avatarPath.startsWith('http')) {
    return avatarPath;
  }
  
  // If it's a path, construct full URL
  // Default should match http.ts: 'http://localhost:3000/api/v1'
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
  
  // Remove /api, /api/v1, or any API path from the end
  const baseUrl = apiBaseUrl.replace(/\/api.*$/, '');
  
  return `${baseUrl}${avatarPath}`;
};

/**
 * Gets the initials from a user's name or username
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @param username - User's username (fallback)
 * @returns Two-letter initials
 */
export const getUserInitials = (firstName?: string, lastName?: string, username?: string): string => {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  
  if (username) {
    return username.slice(0, 2).toUpperCase();
  }
  
  return '?';
};
