"use client";

  import {
    useRouter as useNextRouter,
    usePathname,
    useSearchParams,
  } from "next/navigation";
  import NextLink, { type LinkProps as NextLinkProps } from "next/link";
  import { type ComponentProps, forwardRef, useState, useEffect } from "react";

  export type LinkProps = Omit<ComponentProps<"a">, "href"> & {
    to?: string;
    href?: string;
    search?: Record<string, string | undefined>;
    params?: Record<string, string>;
    children?: React.ReactNode;
  };

  export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
    ({ to, href, search, children, ...props }, ref) => {
      let destination = to || href || "/";
      if (search) {
        const p = new URLSearchParams();
        for (const [k, v] of Object.entries(search)) {
          if (v !== undefined && v !== null) p.set(k, String(v));
        }
        const qs = p.toString();
        if (qs) destination = `${destination}?${qs}`;
      }
      return (
        <NextLink href={destination} ref={ref} {...(props as NextLinkProps)}>
          {children}
        </NextLink>
      );
    }
  );
  Link.displayName = "Link";

  type SearchRecord = Record<string, unknown>;

  function buildQs(params: SearchRecord): string {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) p.set(k, String(v));
    }
    return p.toString();
  }

  type NavigateArg =
    | string
    | { to: string; search?: Record<string, string | undefined>; replace?: boolean }
    | { search: true | SearchRecord | ((prev: SearchRecord) => SearchRecord); replace?: boolean };

  export function useNavigate() {
    const router = useNextRouter();
    const pathname = usePathname();

    return (arg: NavigateArg) => {
      // 1. Plain string path
      if (typeof arg === "string") { router.push(arg); return; }

      // 2. { to, search?, replace? } — explicit destination
      if ("to" in arg) {
        const { to, replace } = arg as { to: string; search?: Record<string, string | undefined>; replace?: boolean };
        const search = (arg as { search?: Record<string, string | undefined> }).search;
        let dest = to;
        if (search) { const qs = buildQs(search as SearchRecord); if (qs) dest = `${to}?${qs}`; }
        replace ? router.replace(dest) : router.push(dest);
        return;
      }

      // 3. { search: fn | obj | true, replace? } — useTableUrlState callback form
      //    Read current params from window.location (safe in event handlers).
      const { search: searchArg, replace } = arg as {
        search: true | SearchRecord | ((prev: SearchRecord) => SearchRecord);
        replace?: boolean;
      };

      const current: SearchRecord = {};
      if (typeof window !== "undefined") {
        new URLSearchParams(window.location.search).forEach((v, k) => {
          // Parse numbers back so pagination logic works
          const num = Number(v);
          current[k] = v !== "" && !isNaN(num) ? num : v;
        });
      }

      let next: SearchRecord;
      if (typeof searchArg === "function") next = searchArg(current);
      else if (searchArg === true) next = current;
      else next = { ...current, ...(searchArg ?? {}) };

      const qs = buildQs(next);
      const dest = qs ? `${pathname}?${qs}` : pathname;
      replace ? router.replace(dest) : router.push(dest);
    };
  }

  export function useNavigateRouter() { return useNextRouter(); }

  export function useHistory() {
    return {
      history: typeof window !== "undefined" ? window.history : null,
      go: (delta: number) => typeof window !== "undefined" && window.history.go(delta),
      back: () => typeof window !== "undefined" && window.history.back(),
      forward: () => typeof window !== "undefined" && window.history.forward(),
    };
  }
  export { useHistory as useRouter };

  type LocationState = { pathname: string; href: string };
  export function useLocation(): LocationState;
  export function useLocation<T>(options: { select: (loc: LocationState) => T }): T;
  export function useLocation<T>(opts?: { select?: (loc: LocationState) => T }): LocationState | T {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const search = searchParams.toString();
    const href = search ? `${pathname}?${search}` : pathname;
    const location: LocationState = { pathname, href };
    if (opts?.select) return opts.select(location);
    return location;
  }

  export function useSearch<T extends SearchRecord = SearchRecord>(): T {
    const searchParams = useSearchParams();
    const result: SearchRecord = {};
    searchParams.forEach((value, key) => {
      const num = Number(value);
      result[key] = value !== "" && !isNaN(num) ? num : value;
    });
    return result as T;
  }

  export function useRouterState() {
    const pathname = usePathname();
    const [status, setStatus] = useState<"idle" | "pending">("idle");
    useEffect(() => {
      setStatus("pending");
      const timer = setTimeout(() => setStatus("idle"), 300);
      return () => clearTimeout(timer);
    }, [pathname]);
    return { status };
  }

  export function useParams<T extends Record<string, string> = Record<string, string>>(): T {
    return {} as T;
  }
  export function useMatch(_opts: unknown) { return null; }
  export function redirect(_opts: { to: string; [key: string]: unknown }) { return null; }
  export function Outlet() { return null; }

  export function createFileRoute(_path: string) {
    return function(_options: unknown) { return { useSearch, useParams, useMatch }; };
  }
  export function createRootRouteWithContext<_TContext = unknown>() {
    return function(_options: unknown) { return { useSearch, useParams, useMatch }; };
  }
  export function getRouteApi(_path: string) {
    return { useSearch, useNavigate, useParams, useMatch };
  }
  