// apps/meet-app/src/lib/jitsi-loader.ts
// client-only
function loadScript(src: string) {
    return new Promise<void>((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const s = document.createElement('script');
        s.src = src; s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`failed to load ${src}`));
        document.head.appendChild(s);
    });
}
// client-only
export async function ensureJitsiLibs() {
    if (typeof window === 'undefined') return;

    // 1) Strophe core
    if (!(window as any).Strophe) {
        const strophe = await import('strophe.js');
        (window as any).Strophe = (strophe as any).Strophe || strophe;
    }

    // 2) Load plugins Strophe (disco, caps)
    if (!(window as any)._strophePluginsLoaded) {
        await import('strophejs-plugin-disco');
        await import('strophejs-plugin-caps');
        (window as any)._strophePluginsLoaded = true;
    }

    // 3) WebRTC adapter
    if (!(window as any)._webrtcAdapterLoaded) {
        await import('webrtc-adapter');
        (window as any)._webrtcAdapterLoaded = true;
    }

    // 4) lib-jitsi-meet
    if (!(window as any).JitsiMeetJS) {
        const mod = await import('lib-jitsi-meet/dist/lib-jitsi-meet.min.js');
        (window as any).JitsiMeetJS = (mod as any).default || (window as any).JitsiMeetJS;
    }
}

