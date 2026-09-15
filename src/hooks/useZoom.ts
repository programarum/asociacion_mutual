import { useCallback, useEffect, useState } from "react";
import { getCurrentWebview } from "@tauri-apps/api/webview";

const STORAGE_KEY = "app-zoom-factor";
const ZOOM_MIN = 0.8;
const ZOOM_MAX = 2.0;
const ZOOM_STEP = 0.1;
const DEFAULT_ZOOM = 1.0;

function isTauri(): boolean {
  return "__TAURI_INTERNALS__" in window;
}

function readStoredZoom(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return DEFAULT_ZOOM;
    const value = Number.parseFloat(raw);
    if (!Number.isFinite(value)) return DEFAULT_ZOOM;
    return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value));
  } catch {
    return DEFAULT_ZOOM;
  }
}

function clamp(n: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(n * 10) / 10));
}

function roundToStep(value: number): number {
  return Math.round(value / ZOOM_STEP) * ZOOM_STEP;
}

interface UseZoomResult {
  zoom: number;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomReset: () => void;
}

export function useZoom(): UseZoomResult {
  const [zoom, setZoom] = useState(readStoredZoom);

  const applyZoom = useCallback(async (factor: number) => {
    const clamped = clamp(factor);
    try {
      localStorage.setItem(STORAGE_KEY, String(clamped));
    } catch {
      // ignore storage errors
    }
    setZoom(clamped);
    if (!isTauri()) return;
    try {
      await getCurrentWebview().setZoom(clamped);
    } catch {
      // ignore zoom errors in non-Tauri environments
    }
  }, []);

  useEffect(() => {
    applyZoom(readStoredZoom());
  }, [applyZoom]);

  const zoomIn = useCallback(() => {
    const next = roundToStep(zoom + ZOOM_STEP);
    void applyZoom(Math.min(ZOOM_MAX, next));
  }, [zoom, applyZoom]);

  const zoomOut = useCallback(() => {
    const next = roundToStep(zoom - ZOOM_STEP);
    void applyZoom(Math.max(ZOOM_MIN, next));
  }, [zoom, applyZoom]);

  const zoomReset = useCallback(() => {
    void applyZoom(DEFAULT_ZOOM);
  }, [applyZoom]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const key = e.key.toLowerCase();
      if (key === "=" || key === "+") {
        e.preventDefault();
        zoomIn();
      } else if (key === "-") {
        e.preventDefault();
        zoomOut();
      } else if (key === "0") {
        e.preventDefault();
        zoomReset();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [zoomIn, zoomOut, zoomReset]);

  return { zoom, zoomIn, zoomOut, zoomReset };
}