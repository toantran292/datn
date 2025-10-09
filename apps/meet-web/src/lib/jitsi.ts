let jitsiLoadingPromise: Promise<void> | null = null;

export function loadJitsiScript(src = 'https://meet.jit.si/libs/lib-jitsi-meet.min.js') {
    if (typeof window === 'undefined') return Promise.resolve();
    if ((window as any).JitsiMeetJS) return Promise.resolve();
    if (jitsiLoadingPromise) return jitsiLoadingPromise;

    jitsiLoadingPromise = new Promise<void>((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = (e) => reject(e);
        document.head.appendChild(s);
    });
    return jitsiLoadingPromise;
}

export function getJitsi() {
    return (window as any).JitsiMeetJS;
}


