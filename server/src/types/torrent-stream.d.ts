declare module 'torrent-stream' {
  import { Readable } from 'stream';

  interface TorrentFile {
    name: string;
    path: string;
    length: number;
    offset: number;
    createReadStream(opts?: { start?: number; end?: number }): Readable;
    select(): void;
    deselect(): void;
  }

  interface TorrentEngineOptions {
    connections?: number;
    uploads?: number;
    tmp?: string;
    path?: string;
    verify?: boolean;
    dht?: boolean;
    tracker?: boolean;
    trackers?: string[];
  }

  interface TorrentEngine {
    files: TorrentFile[];
    destroy(callback?: () => void): void;
    remove(keepPieces: boolean, callback?: () => void): void;
    on(event: 'ready', callback: () => void): this;
    on(event: 'torrent', callback: (torrent: unknown) => void): this;
    on(event: 'idle', callback: () => void): this;
    on(event: 'download', callback: (pieceIndex: number) => void): this;
    on(event: 'upload', callback: (pieceIndex: number) => void): this;
    on(event: string, callback: (...args: unknown[]) => void): this;
    swarm: {
      downloaded: number;
      uploaded: number;
    };
  }

  function torrentStream(link: string | Buffer, opts?: TorrentEngineOptions): TorrentEngine;

  export = torrentStream;
}
