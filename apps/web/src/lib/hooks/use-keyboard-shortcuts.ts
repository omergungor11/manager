'use client';

import { useEffect, useCallback, useRef } from 'react';

export interface ShortcutDefinition {
  /** Human-readable label shown in the help modal */
  label: string;
  /** Key combination description shown in the help modal, e.g. "F2", "Ctrl+K" */
  display: string;
  handler: (event: KeyboardEvent) => void;
}

export interface ShortcutMap {
  [shortcutId: string]: ShortcutDefinition;
}

interface NormalizedKey {
  key: string;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
}

function normalizeEvent(event: KeyboardEvent): NormalizedKey {
  return {
    key: event.key.toLowerCase(),
    ctrl: event.ctrlKey || event.metaKey,
    shift: event.shiftKey,
    alt: event.altKey,
  };
}

function matchesShortcut(normalized: NormalizedKey, shortcutId: string): boolean {
  const lower = shortcutId.toLowerCase();

  if (lower === 'f2') return normalized.key === 'f2' && !normalized.ctrl && !normalized.shift;
  if (lower === 'f3') return normalized.key === 'f3' && !normalized.ctrl && !normalized.shift;
  if (lower === 'ctrl+k') return normalized.ctrl && normalized.key === 'k' && !normalized.shift;
  if (lower === 'escape') return normalized.key === 'escape';
  if (lower === '?') return normalized.shift && normalized.key === '?';

  // Generic fallback: parse the shortcutId
  const parts = lower.split('+');
  const mainKey = parts[parts.length - 1] ?? '';
  const needsCtrl = parts.includes('ctrl') || parts.includes('meta');
  const needsShift = parts.includes('shift');
  const needsAlt = parts.includes('alt');

  return (
    mainKey !== '' &&
    normalized.key === mainKey &&
    normalized.ctrl === needsCtrl &&
    normalized.shift === needsShift &&
    normalized.alt === needsAlt
  );
}

/**
 * Global shortcut registry — allows multiple hook instances to share one listener.
 * The registry is module-level so all hook instances collaborate.
 */
const globalRegistry = new Map<string, ShortcutDefinition>();
let listenerAttached = false;

function handleGlobalKeyDown(event: KeyboardEvent): void {
  // Skip when typing in input-like elements
  const target = event.target as HTMLElement;
  const isTyping =
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT' ||
    target.isContentEditable;

  // Allow Escape, F2, F3 even in inputs; block Ctrl+K and ? in inputs
  const normalized = normalizeEvent(event);
  const isEscape = normalized.key === 'escape';
  const isFunctionKey = normalized.key === 'f2' || normalized.key === 'f3';

  if (isTyping && !isEscape && !isFunctionKey) return;

  for (const [shortcutId, definition] of globalRegistry.entries()) {
    if (matchesShortcut(normalized, shortcutId)) {
      definition.handler(event);
      return; // First match wins
    }
  }
}

/**
 * Register keyboard shortcuts. Each call merges shortcuts into the global registry.
 * Shortcuts are removed when the component unmounts.
 *
 * @param shortcuts - Map of shortcutId → ShortcutDefinition
 * @returns void
 *
 * @example
 * useKeyboardShortcuts({
 *   'ctrl+k': { label: 'Arama', display: 'Ctrl+K', handler: openSearch },
 *   'Escape': { label: 'Kapat', display: 'Esc', handler: closeModal },
 * });
 */
export function useKeyboardShortcuts(shortcuts: ShortcutMap): void {
  // Stable ref so we can clean up exactly the keys we registered
  const registeredKeysRef = useRef<string[]>([]);

  // Attach global listener once
  useEffect(() => {
    if (!listenerAttached && typeof window !== 'undefined') {
      window.addEventListener('keydown', handleGlobalKeyDown);
      listenerAttached = true;
    }
    return () => {
      // Only detach when registry is empty (last consumer unmounts)
      if (globalRegistry.size === 0) {
        window.removeEventListener('keydown', handleGlobalKeyDown);
        listenerAttached = false;
      }
    };
  }, []);

  useEffect(() => {
    const keys = Object.keys(shortcuts);
    registeredKeysRef.current = keys;

    for (const [id, def] of Object.entries(shortcuts)) {
      globalRegistry.set(id, def);
    }

    return () => {
      for (const id of registeredKeysRef.current) {
        globalRegistry.delete(id);
      }
    };
  }, [shortcuts]);
}

/**
 * Returns a snapshot of all currently registered shortcuts for display in help modals.
 */
export function useRegisteredShortcuts(): ShortcutDefinition[] {
  return Array.from(globalRegistry.values());
}

/**
 * Convenience: returns a stable snapshot of the global registry
 * suitable for rendering a shortcut list.
 */
export function getRegisteredShortcuts(): Array<ShortcutDefinition & { id: string }> {
  return Array.from(globalRegistry.entries()).map(([id, def]) => ({ id, ...def }));
}
