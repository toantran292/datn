export function buildInviteUrl(room: string) {
    const base = window.location.origin;
    return `${base}/meet/${room}`;
}
export async function copyToClipboard(text: string) {
    try { await navigator.clipboard.writeText(text); return true; }
    catch { return false; }
}
