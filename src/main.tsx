import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/layout/theme-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { queryClient } from '@/lib/query-client'
import { router } from '@/routes'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <RouterProvider
            router={router}
            future={{ v7_startTransition: true }}
          />
        </TooltipProvider>
        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
