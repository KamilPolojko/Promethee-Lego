"use client"

import "./globals.css";
import {AppRouterCacheProvider} from "@mui/material-nextjs/v13-appRouter";
import React from "react";
import DrawerAppBar from "@/app/NavBar/navbar";
import {QueryClient} from "@tanstack/query-core";
import {QueryClientProvider} from "@tanstack/react-query";


const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
          <html lang="en">
          <body className="bg-secondary">
              <QueryClientProvider client={queryClient}>
                  <AppRouterCacheProvider>
                          <DrawerAppBar/>
                          {children}
                  </AppRouterCacheProvider>
              </QueryClientProvider>
          </body>
          </html>

  );
}
