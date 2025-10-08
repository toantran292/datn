import { useEffect, useRef } from "react";

export function useDragSidebar({
                                 containerRef,
                                 onWidthChange,
                                 min = 200,
                                 rightPadding = 360,
                               }: {
  // 👇 Cho phép null để khớp với useRef<HTMLDivElement | null>(null)
  containerRef: React.RefObject<HTMLDivElement | null>;
  onWidthChange: (w: number) => void;
  min?: number;
  rightPadding?: number;
}) {
  const dragging = useRef(false);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const max = Math.max(240, containerRef.current.clientWidth - rightPadding);
      onWidthChange(Math.min(Math.max(e.clientX, min), max));
    };
    const onUp = () => (dragging.current = false);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [containerRef, min, rightPadding, onWidthChange]);

  const handleMouseDown = () => (dragging.current = true);

  return { handleMouseDown } as const;
}
