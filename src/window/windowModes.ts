import { LogicalPosition, LogicalSize, getCurrentWindow } from '@tauri-apps/api/window';
import type { WindowMode } from '../lib/storage';

export async function setWindowMode(mode: WindowMode): Promise<void> {
  try {
    const appWindow = getCurrentWindow();
    await appWindow.setAlwaysOnTop(mode === 'pin');
    await appWindow.setAlwaysOnBottom(mode === 'desktop');
  } catch {
    // Browser preview and older WebView runtimes do not expose these window flags.
  }
}

export async function cycleWindowSize(): Promise<void> {
  try {
    const appWindow = getCurrentWindow();
    const width = (await appWindow.innerSize()).toLogical(await appWindow.scaleFactor()).width;
    const next = width > 400 ? 350 : width > 260 ? 210 : 500;
    await appWindow.setSize(new LogicalSize(next, Math.round(next * 1.12)));
  } catch {
    // Browser preview has no native window to resize.
  }
}

export async function restoreWindowGeometry(geometry: { width: number; height: number; x?: number; y?: number }): Promise<void> {
  try {
    const appWindow = getCurrentWindow();
    await appWindow.setSize(new LogicalSize(geometry.width, geometry.height));
    if (typeof geometry.x === 'number' && typeof geometry.y === 'number') {
      await appWindow.setPosition(new LogicalPosition(geometry.x, geometry.y));
    }
  } catch {
    // Browser preview and older WebView runtimes have no native geometry.
  }
}

export async function watchWindowGeometry(onChange: (geometry: { width?: number; height?: number; x?: number; y?: number }) => void): Promise<() => void> {
  try {
    const appWindow = getCurrentWindow();
    const scale = await appWindow.scaleFactor();
    const unlistenResize = await appWindow.onResized(({ payload }) => onChange({ width: Math.round(payload.width / scale), height: Math.round(payload.height / scale) }));
    const unlistenMove = await appWindow.onMoved(({ payload }) => onChange({ x: Math.round(payload.x / scale), y: Math.round(payload.y / scale) }));
    return () => { unlistenResize(); unlistenMove(); };
  } catch {
    return () => undefined;
  }
}

export async function minimizeWindow(): Promise<void> {
  try { await getCurrentWindow().minimize(); } catch { /* preview */ }
}

export async function closeWindow(): Promise<void> {
  try { await getCurrentWindow().close(); } catch { /* preview */ }
}

export async function startWindowDrag(): Promise<void> {
  try { await getCurrentWindow().startDragging(); } catch { /* preview */ }
}
