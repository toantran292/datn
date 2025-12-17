'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { BackgroundOption } from '@/components/SettingsPanel';

interface UseVirtualBackgroundOptions {
  enabled: boolean;
  background: BackgroundOption;
}

interface UseVirtualBackgroundReturn {
  processedStream: MediaStream | null;
  isProcessing: boolean;
  isInitialized: boolean;
  error: string | null;
  applyToVideoElement: (video: HTMLVideoElement) => HTMLCanvasElement | null;
  stopProcessing: () => void;
}

// MediaPipe Image Segmenter from tasks-vision
let imageSegmenter: any = null;
let isInitializing = false;

async function initializeSegmenter() {
  if (imageSegmenter || isInitializing) return imageSegmenter;

  isInitializing = true;

  try {
    const { ImageSegmenter, FilesetResolver } = await import('@mediapipe/tasks-vision');

    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );

    imageSegmenter = await ImageSegmenter.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      outputCategoryMask: true,
      outputConfidenceMasks: false,
    });

    console.log('[VirtualBg] MediaPipe ImageSegmenter initialized');
    isInitializing = false;
    return imageSegmenter;
  } catch (err) {
    console.error('[VirtualBg] Failed to initialize ImageSegmenter:', err);
    isInitializing = false;
    throw err;
  }
}

export function useVirtualBackground({
  enabled,
  background,
}: UseVirtualBackgroundOptions): UseVirtualBackgroundReturn {
  const [processedStream, setProcessedStream] = useState<MediaStream | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const backgroundImageRef = useRef<HTMLImageElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);

  // Initialize segmenter on mount if background effect is enabled
  useEffect(() => {
    if (enabled && background.type !== 'none') {
      initializeSegmenter()
        .then(() => setIsInitialized(true))
        .catch((err) => {
          setError('Failed to initialize virtual background');
          console.error(err);
        });
    }
  }, [enabled, background.type]);

  // Load background image
  useEffect(() => {
    if (background.type === 'image' && background.value) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        backgroundImageRef.current = img;
        console.log('[VirtualBg] Background image loaded:', background.value);
      };
      img.onerror = () => {
        console.error('[VirtualBg] Failed to load background image:', background.value);
      };
      img.src = background.value;
    } else {
      backgroundImageRef.current = null;
    }
  }, [background]);

  // Process a video element and return canvas with effect
  const applyToVideoElement = useCallback((video: HTMLVideoElement): HTMLCanvasElement | null => {
    if (!enabled || background.type === 'none' || !video) {
      return null;
    }

    // Create canvas if not exists
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    if (!maskCanvasRef.current) {
      maskCanvasRef.current = document.createElement('canvas');
    }

    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;

    // Match video dimensions
    if (video.videoWidth > 0 && video.videoHeight > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      maskCanvas.width = video.videoWidth;
      maskCanvas.height = video.videoHeight;
    }

    ctxRef.current = canvas.getContext('2d', { willReadFrequently: true });
    maskCtxRef.current = maskCanvas.getContext('2d', { willReadFrequently: true });

    const ctx = ctxRef.current;
    const maskCtx = maskCtxRef.current;

    if (!ctx || !maskCtx) return null;

    // Start processing loop
    const processFrame = async () => {
      if (!video || video.paused || video.ended) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      // Skip if same frame
      if (video.currentTime === lastVideoTimeRef.current) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }
      lastVideoTimeRef.current = video.currentTime;

      try {
        if (background.type === 'blur') {
          await applyBlurEffect(video, canvas, ctx, maskCanvas, maskCtx);
        } else if (background.type === 'image' && backgroundImageRef.current) {
          await applyImageBackground(video, canvas, ctx, maskCanvas, maskCtx, backgroundImageRef.current);
        }
      } catch (err) {
        // Fallback to original video
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }

      animationFrameRef.current = requestAnimationFrame(processFrame);
    };

    setIsProcessing(true);
    processFrame();

    return canvas;
  }, [enabled, background]);

  // Apply blur effect
  const applyBlurEffect = async (
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    maskCanvas: HTMLCanvasElement,
    maskCtx: CanvasRenderingContext2D
  ) => {
    if (!imageSegmenter) {
      // Fallback: simple blur (whole image)
      ctx.filter = 'blur(10px)';
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.filter = 'none';
      return;
    }

    // Get segmentation result
    const result = imageSegmenter.segmentForVideo(video, performance.now());
    const mask = result.categoryMask;

    if (!mask) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return;
    }

    // Get mask data
    const maskData = mask.getAsUint8Array();
    const width = mask.width;
    const height = mask.height;

    // Create ImageData for mask
    const imageData = maskCtx.createImageData(width, height);
    for (let i = 0; i < maskData.length; i++) {
      // Mask value: 0 = background, 255 = person
      const isForeground = maskData[i] > 0;
      const idx = i * 4;
      imageData.data[idx] = isForeground ? 255 : 0;     // R
      imageData.data[idx + 1] = isForeground ? 255 : 0; // G
      imageData.data[idx + 2] = isForeground ? 255 : 0; // B
      imageData.data[idx + 3] = isForeground ? 255 : 0; // A
    }
    maskCtx.putImageData(imageData, 0, 0);

    // Draw blurred background first
    ctx.filter = 'blur(15px)';
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.filter = 'none';

    // Use mask to composite person on top
    ctx.globalCompositeOperation = 'destination-out';
    ctx.drawImage(maskCanvas, 0, 0, canvas.width, canvas.height);

    ctx.globalCompositeOperation = 'destination-over';
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    ctx.globalCompositeOperation = 'source-over';

    mask.close();
  };

  // Apply image background
  const applyImageBackground = async (
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    maskCanvas: HTMLCanvasElement,
    maskCtx: CanvasRenderingContext2D,
    bgImage: HTMLImageElement
  ) => {
    if (!imageSegmenter) {
      // Fallback: just show video
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return;
    }

    // Get segmentation result
    const result = imageSegmenter.segmentForVideo(video, performance.now());
    const mask = result.categoryMask;

    if (!mask) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return;
    }

    // Get mask data
    const maskData = mask.getAsUint8Array();
    const width = mask.width;
    const height = mask.height;

    // Draw background image (cover entire canvas)
    const imgRatio = bgImage.width / bgImage.height;
    const canvasRatio = canvas.width / canvas.height;
    let drawWidth, drawHeight, offsetX, offsetY;

    if (imgRatio > canvasRatio) {
      drawHeight = canvas.height;
      drawWidth = bgImage.width * (canvas.height / bgImage.height);
      offsetX = (canvas.width - drawWidth) / 2;
      offsetY = 0;
    } else {
      drawWidth = canvas.width;
      drawHeight = bgImage.height * (canvas.width / bgImage.width);
      offsetX = 0;
      offsetY = (canvas.height - drawHeight) / 2;
    }
    ctx.drawImage(bgImage, offsetX, offsetY, drawWidth, drawHeight);

    // Create mask ImageData
    const imageData = maskCtx.createImageData(width, height);
    for (let i = 0; i < maskData.length; i++) {
      const isForeground = maskData[i] > 0;
      const idx = i * 4;
      imageData.data[idx] = isForeground ? 255 : 0;
      imageData.data[idx + 1] = isForeground ? 255 : 0;
      imageData.data[idx + 2] = isForeground ? 255 : 0;
      imageData.data[idx + 3] = isForeground ? 255 : 0;
    }
    maskCtx.putImageData(imageData, 0, 0);

    // Create temp canvas for person
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d')!;

    // Draw person on temp canvas
    tempCtx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Apply mask to show only person
    tempCtx.globalCompositeOperation = 'destination-in';
    tempCtx.drawImage(maskCanvas, 0, 0, canvas.width, canvas.height);

    // Draw person over background
    ctx.drawImage(tempCanvas, 0, 0);

    mask.close();
  };

  // Stop processing
  const stopProcessing = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    lastVideoTimeRef.current = -1;
    setIsProcessing(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopProcessing();
    };
  }, [stopProcessing]);

  return {
    processedStream,
    isProcessing,
    isInitialized,
    error,
    applyToVideoElement,
    stopProcessing,
  };
}
