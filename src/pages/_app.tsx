import "@/styles/globals.css";

import type { AppProps } from "next/app";
import Head from "next/head";

import { ClerkProvider } from "@clerk/nextjs";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Toaster } from "react-hot-toast";

export default function App({ Component, pageProps }: AppProps) {
  const queryClient = new QueryClient();
  return (
    <ClerkProvider {...pageProps}>
      <QueryClientProvider client={queryClient}>
        <Head>
          <title>Bottich - Efficient ToDos</title>
          <meta name="Efficient ToDos" content="Quick and Efficient ToDo App" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <Toaster />
          <Component {...pageProps} />
        </div>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
