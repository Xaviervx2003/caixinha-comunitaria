// client/src/App.tsx
import React from "react";
import { Route, Switch, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { trpc, trpcClient, queryClient } from "@/lib/trpc";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import ErrorBoundary from "@/components/ErrorBoundary";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";

// ── Guardião de Rotas ─────────────────────────────────────────────────────────
const ProtectedRoute = ({ component: Component }: { component: React.ComponentType<any> }) => {
  const { data: user, isLoading } = trpc.auth.me.useQuery();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#00C853]" />
        <span className="text-muted-foreground text-sm font-bold uppercase tracking-widest animate-pulse">
          A iniciar sistema...
        </span>
      </div>
    );
  }

  // 🟢 FIX: se não autenticado, mostra Login.tsx em vez do Home.tsx gerenciar isso
  if (!user) {
    return <Login />;
  }

  return <Component />;
};

// ── Roteamento ────────────────────────────────────────────────────────────────
function Router() {
  return (
    <Switch>
      <Route path="/">
        {() => <ProtectedRoute component={Home} />}
      </Route>
      <Route path="/login" component={Login} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// ── Aplicação Raiz ────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ErrorBoundary>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme="light">
            <TooltipProvider>
              <Router />
              <Toaster position="top-right" richColors />
            </TooltipProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </ErrorBoundary>
  );
}
