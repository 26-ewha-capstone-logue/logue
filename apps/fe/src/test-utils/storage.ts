import { vi } from 'vitest';

export function createStorage() {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  } satisfies Storage;
}

export function installWindowStorage() {
  const localStorage = createStorage();
  const sessionStorage = createStorage();
  const dispatchEvent = vi.fn();

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage,
      sessionStorage,
      dispatchEvent,
    },
  });

  return { dispatchEvent, localStorage, sessionStorage };
}
