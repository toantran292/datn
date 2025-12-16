/**
 * Utility functions for Jitsi hooks
 */

/**
 * Normalize Jitsi participant ID (extract from JID)
 */
export function normalizeId(jid: string): string {
  if (!jid) return '';
  const parts = jid.split('/');
  return parts.length > 1 ? parts[1] : parts[0];
}

/**
 * Check if a track is a desktop/screen share track
 */
export function isDesktopTrack(track: any): boolean {
  if (track.getType() !== 'video') return false;
  const videoType = track.getVideoType?.() || track.videoType;
  return videoType === 'desktop';
}

/**
 * Check if a track is a camera video track
 */
export function isCameraTrack(track: any): boolean {
  if (track.getType() !== 'video') return false;
  const videoType = track.getVideoType?.() || track.videoType;
  return videoType !== 'desktop';
}

/**
 * Get the original MediaStream from a JitsiTrack
 */
export function getOriginalStream(track: any): MediaStream | null {
  try {
    return track.getOriginalStream?.() || track.stream || null;
  } catch {
    return null;
  }
}
