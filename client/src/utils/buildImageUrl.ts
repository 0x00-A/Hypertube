const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_URL || 'https://image.tmdb.org/t/p';

export function buildImageUrl(
  path: string | undefined,
  size: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500'
): string | undefined {
  if (!path) return undefined;
  
  // If path is already a full URL, return it
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  return `${IMAGE_BASE_URL}/${size}${path}`;
}
