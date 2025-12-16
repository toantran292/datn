"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import ReactCrop, {
  Crop,
  PixelCrop,
  makeAspectCrop,
  centerCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { canvasPreview } from "./canvasPreview";

interface ImageCropperProps {
  image: File | null;
  onCropComplete: (croppedFile: File) => void;
  onCancel: () => void;
  aspect?: number;
}

export function ImageCropper({
  image,
  onCropComplete,
  onCancel,
  aspect = 1,
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [imgSrc, setImgSrc] = useState<string>("");
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Update image when file changes
  useEffect(() => {
    if (image) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImgSrc(e.target?.result as string);
      };
      reader.readAsDataURL(image);
    } else {
      setImgSrc("");
    }
  }, [image]);

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { naturalWidth, naturalHeight } = e.currentTarget;
      const crop = makeAspectCrop(
        {
          unit: "%",
          width: 90,
        },
        aspect,
        naturalWidth,
        naturalHeight
      );
      const centeredCrop = centerCrop(crop, naturalWidth, naturalHeight);
      setCrop(centeredCrop);
    },
    [aspect]
  );

  // Update canvas when crop changes
  useEffect(() => {
    if (completedCrop && imgRef.current && previewCanvasRef.current) {
      canvasPreview(imgRef.current, previewCanvasRef.current, completedCrop);
    }
  }, [completedCrop]);

  const handleCropComplete = useCallback(async () => {
    if (!completedCrop || !previewCanvasRef.current || !imgRef.current) {
      return;
    }

    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        previewCanvasRef.current?.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Failed to create blob"));
            }
          },
          "image/png",
          1.0
        );
      });

      const file = new File([blob], image?.name || "cropped.png", {
        type: "image/png",
      });
      onCropComplete(file);
    } catch (error) {
      console.error("Error creating cropped image:", error);
    }
  }, [completedCrop, image, onCropComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Crop Image (1:1)</h2>

        {imgSrc && (
          <div className="mb-4">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
              minWidth={50}
            >
              <img
                ref={imgRef}
                alt="Crop me"
                src={imgSrc}
                style={{ maxHeight: "400px", width: "100%" }}
                onLoad={onImageLoad}
              />
            </ReactCrop>
          </div>
        )}

        {/* Hidden canvas for preview */}
        {completedCrop && (
          <div className="hidden">
            <canvas
              ref={previewCanvasRef}
              style={{
                objectFit: "contain",
                width: completedCrop.width,
                height: completedCrop.height,
              }}
            />
          </div>
        )}

        <div className="flex justify-end space-x-3 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCropComplete}
            disabled={!completedCrop}
            className="px-4 py-2 bg-[#FF8800] text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
}

