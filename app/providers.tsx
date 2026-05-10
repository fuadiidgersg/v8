"use client";

import { useState } from "react";
import { AxiosError } from "axios";
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import { handleServerError } from "@/lib/handle-server-error";
import { ThemeProvider } from "@/context/theme-provider";
import { FontProvider } from "@/context/font-provider";
import { DirectionProvider } from "@/context/direction-provider";
import { Toaster } from "@/components/ui/sonner";
import { NavigationProgress } from "@/components/navigation-progress";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: (failureCount, error) => {
              if (failureCount >= 0 && process.env.NODE_ENV === "development")
                return false;
              if (failureCount > 3 && process.env.NODE_ENV === "production")
                return false;
              return !(
                error instanceof AxiosError &&
                [401, 403].includes(error.response?.status ?? 0)
              );
            },
            refetchOnWindowFocus: process.env.NODE_ENV === "production",
            staleTime: 10 * 1000,
          },
          mutations: {
            onError: (error) => {
              handleServerError(error);
              if (error instanceof AxiosError) {
                if (error.response?.status === 304) {
                  toast.error("Content not modified!");
                }
              }
            },
          },
        },
        queryCache: new QueryCache({
          onError: (error) => {
            if (error instanceof AxiosError) {
              if (error.response?.status === 401) {
                toast.error("Session expired!");
                useAuthStore.getState().auth.reset();
              }
              if (error.response?.status === 500) {
                toast.error("Internal Server Error!");
              }
            }
          },
        }),
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <FontProvider>
          <DirectionProvider>
            <NavigationProgress />
            {children}
            <Toaster duration={5000} />
          </DirectionProvider>
        </FontProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
