export const YOUTUBE_PLAYER_STATE = {
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
} as const;

export interface YouTubePlayer {
  destroy(): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlaybackRate(): number;
  getPlayerState(): number;
}

interface YouTubePlayerEvent {
  data: number;
}

interface YouTubePlayerOptions {
  events: {
    onReady?: () => void;
    onStateChange?: (event: YouTubePlayerEvent) => void;
  };
}

interface YouTubeNamespace {
  Player: new (
    iframe: HTMLIFrameElement,
    options: YouTubePlayerOptions
  ) => YouTubePlayer;
}

declare global {
  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YouTubeNamespace> | null = null;

export function loadYouTubeIframeApi(): Promise<YouTubeNamespace> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('YouTube IFrame API is client-only'));
  }
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<YouTubeNamespace>((resolve, reject) => {
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      if (window.YT?.Player) resolve(window.YT);
      else reject(new Error('YouTube IFrame API loaded without Player'));
    };

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-youtube-iframe-api]'
    );
    if (existing) return;

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.dataset.youtubeIframeApi = 'true';
    script.onerror = () =>
      reject(new Error('Could not load YouTube IFrame API'));
    document.head.appendChild(script);
  });

  return apiPromise;
}
