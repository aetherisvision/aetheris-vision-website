/**
 * Test stub for `next/navigation`. Components such as ContactForm read
 * `useSearchParams()`; tests can seed the params via `__setSearchParams`.
 */
let currentParams = new URLSearchParams();

export function __setSearchParams(params: URLSearchParams | string): void {
  currentParams = typeof params === "string" ? new URLSearchParams(params) : params;
}

export function __resetSearchParams(): void {
  currentParams = new URLSearchParams();
}

export function useSearchParams(): URLSearchParams {
  return currentParams;
}

export function usePathname(): string {
  return "/";
}

export function useRouter() {
  return {
    push: () => {},
    replace: () => {},
    back: () => {},
    forward: () => {},
    refresh: () => {},
    prefetch: () => {},
  };
}
