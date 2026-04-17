import * as VideoThumbnails from "expo-video-thumbnails";

/**
 * Parse an HLS .m3u8 manifest to find the first .ts segment URL.
 * Handles master playlists (variant .m3u8 refs) and media playlists.
 */
async function getFirstSegmentUrl(m3u8Url: string): Promise<string | null> {
  const response = await fetch(m3u8Url);
  const text = await response.text();
  const base = m3u8Url.substring(0, m3u8Url.lastIndexOf("/") + 1);
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));

  if (lines.length === 0) return null;

  const resolve = (path: string) =>
    path.startsWith("http") ? path : base + path;

  // Master playlist → recurse into first variant
  if (lines[0].includes(".m3u8")) {
    return getFirstSegmentUrl(resolve(lines[0]));
  }

  // Media playlist → first .ts segment
  return resolve(lines[0]);
}

/**
 * Generate a thumbnail for any video URL. Works with:
 * - Direct files (.mp4, .mov) — getThumbnailAsync directly
 * - HLS (.m3u8) — parses manifest, extracts first .ts segment, generates from that
 *
 * Returns the local file URI or null on failure.
 */
export async function generateVideoThumbnail(
  videoUrl: string,
): Promise<string | null> {
  // Try direct first (works for .mp4, sometimes .m3u8 on iOS)
  try {
    const { uri } = await VideoThumbnails.getThumbnailAsync(videoUrl, {
      time: 0,
      quality: 0.7,
    });
    return uri;
  } catch {
    // Fall through to HLS parsing
  }

  // HLS: parse manifest → get first .ts segment → thumbnail from that
  if (videoUrl.includes(".m3u8")) {
    try {
      const segmentUrl = await getFirstSegmentUrl(videoUrl);
      if (!segmentUrl) return null;
      const { uri } = await VideoThumbnails.getThumbnailAsync(segmentUrl, {
        time: 0,
        quality: 0.7,
      });
      return uri;
    } catch {
      return null;
    }
  }

  return null;
}
