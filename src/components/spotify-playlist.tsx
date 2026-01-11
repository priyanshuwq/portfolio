"use client";

import { motion } from "framer-motion";

interface SpotifyPlaylistProps {
  playlistId?: string;
}

export function SpotifyPlaylist({ playlistId }: SpotifyPlaylistProps) {
  // Default to a popular coding/focus playlist if none provided
  const defaultPlaylist = "37i9dQZF1DX5trt9i14X7j"; // Spotify's "Focus Flow" playlist
  const embedId = playlistId || defaultPlaylist;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full mt-4"
    >
      <div className="rounded-xl overflow-hidden border border-black/10 dark:border-white/10 shadow-lg">
        <iframe
          src={`https://open.spotify.com/embed/playlist/${embedId}?utm_source=generator&theme=0`}
          width="100%"
          height="352"
          frameBorder="0"
          allowFullScreen
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="w-full"
        />
      </div>
    </motion.div>
  );
}
