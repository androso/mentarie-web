"use client";

import { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/hooks/useAuth";
import { TranscriptProvider } from "@/contexts/TranscriptContext";

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TranscriptProvider>
          {children}
        </TranscriptProvider>
        <Toaster position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
