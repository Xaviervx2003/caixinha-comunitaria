// client/src/App.tsx
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import { trpc, trpcClient, queryClient } from "./lib/trpc";

// ─────────────────────────────────────────
// Guard de rota — bloqueia acesso sem autenticação
// ─────────────────────────────────────────
function ProtectedRoute({ component: Component }: { component: () => JSX.Element }) {
  const { data: user, isLoading } = trpc.auth.me.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-muted-foreground text-sm">Carregando...</span>
      </div>
    );
  }

  // Quando criar Login.tsx: troque o Redirect por <Login />
  // e adicione <Route path="/login" component={Login} /> no Router
  if (!user) return <Redirect to="/404" />;

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        {() => <ProtectedRoute component={Home} />}
      </Route>

      <Route path="/404" component={NotFound} />

      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme="light">
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </ErrorBoundary>
  );
}

export default App;