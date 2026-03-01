import { httpClient } from "./http";
import type { IResponse, IStreamStatus } from "../types/movie.types";

class StreamingService {
  private readonly BASE_PATH = "/stream";

  /**
   * Build the full streaming URL for a movie.
   * This URL is used as the `src` of a `<video>` element.
   * The server handles Range requests for seeking support.
   * Derived from httpClient's baseURL so it can never drift from the API client.
   */
  getStreamUrl(movieId: string): string {
    const baseURL =
      httpClient.getClient().defaults.baseURL ?? "http://localhost:3000/api/v1";
    return `${baseURL}${this.BASE_PATH}/${movieId}`;
  }

  /**
   * Get the streaming status for a movie (download status + available subtitles).
   */
  async getStreamStatus(movieId: string): Promise<IStreamStatus> {
    const response = await httpClient.get<IResponse<IStreamStatus>>(
      `${this.BASE_PATH}/${movieId}/status`,
    );
    return response.data;
  }
}

export const streamingService = new StreamingService();
