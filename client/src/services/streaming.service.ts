import { httpClient } from "./http";
import type { IResponse, IStreamStatus } from "../types/movie.types";

class StreamingService {
  private readonly BASE_PATH = "/stream";

  /**
   * Build the full streaming URL for a movie at a specific quality.
   * This URL is used as the `src` of a `<video>` element.
   * The server handles Range requests for seeking support.
   * Derived from httpClient's baseURL so it can never drift from the API client.
   */
  getStreamUrl(movieId: string, quality?: string): string {
    const baseURL =
      httpClient.getClient().defaults.baseURL ?? "http://localhost:3000/api/v1";
    const url = `${baseURL}${this.BASE_PATH}/${movieId}`;
    if (quality) {
      return `${url}?quality=${encodeURIComponent(quality)}`;
    }
    return url;
  }

  /**
   * Get the streaming status for a movie (download status + available subtitles + qualities).
   */
  async getStreamStatus(movieId: string, quality?: string): Promise<IStreamStatus> {
    const params: Record<string, string> = {};
    if (quality) params.quality = quality;

    const response = await httpClient.get<IResponse<IStreamStatus>>(
      `${this.BASE_PATH}/${movieId}/status`,
      { params },
    );
    return response.data;
  }
}

export const streamingService = new StreamingService();
