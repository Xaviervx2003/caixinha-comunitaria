// client/src/App.tsx
import React from "react";
import { Route, Switch, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Loader2 } from "lucide-react"; // Adicionado para um visual mais profissional

// Configurações e Contextos
import { trpc, trpcClient, queryClient } from "@/lib/trpc";
import { ThemeProvider } from "@/contexts/ThemeContext";

// Componentes UI e Layout
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import ErrorBoundary from "@/components/ErrorBoundary";

// Páginas
import Home from "@/pages/Home";
import NotFound from "@/pages/NotFound";

// ─────────────────────────────────────────
// Guardião de Rotas — Protege contra acessos não autorizados
// ─────────────────────────────────────────
const ProtectedRoute = ({ component: Component }: { component: React.ComponentType<any> }) => {
  const { data: user, isLoading } = trpc.auth.me.useQuery();

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

  // TODO: Quando o sistema de Login estiver criado, alterar a rota de redirecionamento de "/404" para "/login"
  if (!user) return <Redirect to="/404" />;

  return <Component />;
};

// ─────────────────────────────────────────
// Roteamento
// ─────────────────────────────────────────
function Router() {
  return (
    <Switch>
      <Route path="/">
        {() => <ProtectedRoute component={Home} />}
      </Route>

      <Route path="/404" component={NotFound} />

      {/* Fallback (apanha todas as rotas que não existem) */}
      <Route component={NotFound} />
    </Switch>
  );
}

// ─────────────────────────────────────────
// Aplicação Raiz (Injeção de Providers)
// ─────────────────────────────────────────
export default function App() {
  return (
    <ErrorBoundary>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme="light">
            <TooltipProvider>
              {/* O Router renderiza as páginas */}
              <Router />
              {/* O Toaster fica no fim para garantir que aparece sempre por cima de tudo */}
              <Toaster position="top-right" richColors />
            </TooltipProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </ErrorBoundary>
  );
}