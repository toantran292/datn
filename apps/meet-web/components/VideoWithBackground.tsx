'use client';

import { useEffect, useRef, useState } from 'react';
import type { BackgroundOption } from './SettingsPanel';

interface VideoWithBackgroundProps {
  videoElement: HTMLVideoElement | null;
  background: BackgroundOption;
  width: number;
  height: number;
  className?: string;
  style?: React.CSSProperties;
}

// MediaPipe Image Segmenter singleton
let imageSegmenter: any = null;
let isInitializing = false;
let initPromise: Promise<any> | null = null;

async function getSegmenter() {
  if (imageSegmenter) return imageSegmenter;
  if (initPromise) return initPromise;

  isInitializing = true;
  initPromise = (async () => {
    try {
      const { ImageSegmenter, FilesetResolver } = await import('@mediapipe/tasks-vision');

      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      imageSegmenter = await ImageSegmenter.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        outputCategoryMask: true,
        outputConfidenceMasks: false,
      });

      console.log('[VideoWithBackground] MediaPipe segmenter initialized');
      isInitializing = false;
      return imageSegmenter;
    } catch (err) {
      console.error('[VideoWithBackground] Failed to init segmenter:', err);
      isInitializing = false;
      initPromise = null;
      throw err;
    }
  })();

  return initPromise;
}

export function VideoWithBackground({
  videoElement,
  background,
  width,
  height,
  className,
  style,
}: VideoWithBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(-1);
  const [isReady, setIsReady] = useState(false);

  // Load background image
  useEffect(() => {
    if (background.type === 'image' && background.value) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        bgImageRef.current = img;
      };
      img.onerror = () => {
        console.error('[VideoWithBackground] Failed to load bg image');
        bgImageRef.current = null;
      };
      img.src = background.value;
    } else {
      bgImageRef.current = null;
    }
  }, [background]);

  // Initialize segmenter when needed
  useEffect(() => {
    if (background.type !== 'none') {
      getSegmenter()
        .then(() => setIsReady(true))
        .catch(() => setIsReady(false));
    }
  }, [background.type]);

  // Process video frames
  useEffect(() => {
    if (!videoElement || background.type === 'none') {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = width || 640;
    canvas.height = height || 480;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Create mask canvas
    if (!maskCanvasRef.current) {
      maskCanvasRef.current = document.createElement('canvas');
    }
    const maskCanvas = maskCanvasRef.current;
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;
    const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
    if (!maskCtx) return;

    const processFrame = async () => {
      if (!videoElement || videoElement.paused || videoElement.ended) {
        animationRef.current = requestAnimationFrame(processFrame);
        return;
      }

      // Skip same frame
      if (videoElement.currentTime === lastTimeRef.current) {
        animationRef.current = requestAnimationFrame(processFrame);
        return;
      }
      lastTimeRef.current = videoElement.currentTime;

      // Check video dimensions
      if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
        animationRef.current = requestAnimationFrame(processFrame);
        return;
      }

      try {
        if (background.type === 'blur') {
          await applyBlur(videoElement, canvas, ctx, maskCanvas, maskCtx);
        } else if (background.type === 'image' && bgImageRef.current) {
          await applyImageBg(videoElement, canvas, ctx, maskCanvas, maskCtx, bgImageRef.current);
        } else {
          ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        }
      } catch (err) {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      }

      animationRef.current = requestAnimationFrame(processFrame);
    };

    processFrame();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [videoElement, background, width, height]);

  // Apply blur background
  const applyBlur = async (
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    maskCanvas: HTMLCanvasElement,
    maskCtx: CanvasRenderingContext2D
  ) => {
    if (!imageSegmenter) {
      // Fallback: blur entire frame
      ctx.filter = 'blur(10px)';
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.filter = 'none';
      return;
    }

    const result = imageSegmenter.segmentForVideo(video, performance.now());
    const mask = result?.categoryMask;

    if (!mask) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return;
    }

    const maskData = mask.getAsUint8Array();
    const w = mask.width;
    const h = mask.height;

    // Create mask image for PERSON (foreground)
    // MediaPipe selfie segmenter: 0 = PERSON, 255 = BACKGROUND
    // So we need to INVERT the mask values
    const imageData = maskCtx.createImageData(w, h);
    for (let i = 0; i < maskData.length; i++) {
      // In selfie segmenter category mask: 0 = person, 1+ = background
      const isPerson = maskData[i] === 0;
      const idx = i * 4;
      // White (255) for person, transparent (0) for background
      imageData.data[idx] = isPerson ? 255 : 0;     // R
      imageData.data[idx + 1] = isPerson ? 255 : 0; // G
      imageData.data[idx + 2] = isPerson ? 255 : 0; // B
      imageData.data[idx + 3] = isPerson ? 255 : 0; // A - this is key!
    }
    maskCtx.putImageData(imageData, 0, 0);

    // Step 1: Draw blurred video as background
    ctx.filter = 'blur(12px)';
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.filter = 'none';

    // Step 2: Create person layer (sharp video masked by person silhouette)
    const personCanvas = document.createElement('canvas');
    personCanvas.width = canvas.width;
    personCanvas.height = canvas.height;
    const personCtx = personCanvas.getContext('2d')!;

    // Draw sharp video
    personCtx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Use mask to keep only the person area
    personCtx.globalCompositeOperation = 'destination-in';
    personCtx.drawImage(maskCanvas, 0, 0, canvas.width, canvas.height);

    // Step 3: Composite sharp person over blurred background
    ctx.drawImage(personCanvas, 0, 0);

    mask.close();
  };

  // Apply image background
  const applyImageBg = async (
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    maskCanvas: HTMLCanvasElement,
    maskCtx: CanvasRenderingContext2D,
    bgImg: HTMLImageElement
  ) => {
    if (!imageSegmenter) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return;
    }

    const result = imageSegmenter.segmentForVideo(video, performance.now());
    const mask = result?.categoryMask;

    if (!mask) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return;
    }

    const maskData = mask.getAsUint8Array();
    const w = mask.width;
    const h = mask.height;

    // Draw background image (cover)
    const imgRatio = bgImg.width / bgImg.height;
    const canvasRatio = canvas.width / canvas.height;
    let dw, dh, dx, dy;

    if (imgRatio > canvasRatio) {
      dh = canvas.height;
      dw = bgImg.width * (canvas.height / bgImg.height);
      dx = (canvas.width - dw) / 2;
      dy = 0;
    } else {
      dw = canvas.width;
      dh = bgImg.height * (canvas.width / bgImg.width);
      dx = 0;
      dy = (canvas.height - dh) / 2;
    }
    ctx.drawImage(bgImg, dx, dy, dw, dh);

    // Create mask for person (foreground)
    // MediaPipe selfie segmenter: 0 = PERSON, 1+ = BACKGROUND
    const imageData = maskCtx.createImageData(w, h);
    for (let i = 0; i < maskData.length; i++) {
      const isPerson = maskData[i] === 0;
      const idx = i * 4;
      imageData.data[idx] = isPerson ? 255 : 0;
      imageData.data[idx + 1] = isPerson ? 255 : 0;
      imageData.data[idx + 2] = isPerson ? 255 : 0;
      imageData.data[idx + 3] = isPerson ? 255 : 0;
    }
    maskCtx.putImageData(imageData, 0, 0);

    // Create person layer
    const personCanvas = document.createElement('canvas');
    personCanvas.width = canvas.width;
    personCanvas.height = canvas.height;
    const personCtx = personCanvas.getContext('2d')!;

    personCtx.drawImage(video, 0, 0, canvas.width, canvas.height);
    personCtx.globalCompositeOperation = 'destination-in';
    personCtx.drawImage(maskCanvas, 0, 0, canvas.width, canvas.height);

    // Draw person over background
    ctx.drawImage(personCanvas, 0, 0);

    mask.close();
  };

  // If no background effect, return null (use original video)
  if (background.type === 'none') {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      style={style}
    />
  );
}
