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
  search?: Record<string, string>;
  params?: Record<string, string>;
  children?: React.ReactNode;
};

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ to, href, search, children, ...props }, ref) => {
    let destination = to || href || "/";
    if (search) {
      const params = new URLSearchParams(search);
      destination = `${destination}?${params.toString()}`;
    }
    return (
      <NextLink href={destination} ref={ref} {...(props as NextLinkProps)}>
        {children}
      </NextLink>
    );
  }
);
Link.displayName = "Link";

export function useNavigate() {
  const router = useNextRouter();
  return (arg: { to: string; search?: Record<string, string>; replace?: boolean } | string) => {
    const path = typeof arg === "string" ? arg : arg.to;
    const search =
      typeof arg === "object" && arg.search ? arg.search : undefined;
    const replace = typeof arg === "object" && arg.replace;
    let destination = path;
    if (search) {
      const params = new URLSearchParams(search);
      destination = `${path}?${params.toString()}`;
    }
    if (replace) {
      router.replace(destination);
    } else {
      router.push(destination);
    }
  };
}

export function useNavigateRouter() {
  return useNextRouter();
}

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
export function useLocation<T>(options?: { select?: (loc: LocationState) => T }): LocationState | T {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const href = search ? `${pathname}?${search}` : pathname;
  const location: LocationState = { pathname, href };
  if (options?.select) return options.select(location);
  return location;
}

export function useSearch<T extends Record<string, string> = Record<string, string>>(): T {
  const searchParams = useSearchParams();
  const result: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    result[key] = value;
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

export function useMatch(_opts: unknown) {
  return null;
}

export function redirect(_opts: { to: string; [key: string]: unknown }) {
  return null;
}

export function Outlet() {
  return null;
}

export function createFileRoute(_path: string) {
  return function(_options: unknown) {
    return {
      useSearch,
      useParams,
      useMatch,
    };
  };
}

export function createRootRouteWithContext<_TContext = unknown>() {
  return function(_options: unknown) {
    return {
      useSearch,
      useParams,
      useMatch,
    };
  };
}

export function getRouteApi(_path: string) {
  return {
    useSearch,
    useNavigate,
    useParams,
    useMatch,
  };
}
