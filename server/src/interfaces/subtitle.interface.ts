export interface OpenSubtitlesLogin {
  token: string;
  user: any;
  status: number;
}

export interface SubtitleFile {
  file_id: number;
  cd_number?: number;
  file_name: string;
}

export interface SubtitleAttributes {
  subtitle_id: string;
  language: string;
  upload_date: string;
  ratings: number;
  files: SubtitleFile[];
}

export interface OpenSubtitlesSearchResponse {
  total_pages: number;
  total_count: number;
  data: Array<{
    id: string;
    type: string;
    attributes: SubtitleAttributes;
  }>;
}

export interface DownloadLinkResponse {
  link: string;
  file_name: string;
  requests: number;
  remaining: number;
  message: string;
}
