// client/src/lib/trpc.ts
import { createTRPCReact, httpBatchLink } from "@trpc/react-query";
import { QueryClient } from "@tanstack/react-query";
import superjson from "superjson";
import type { AppRouter } from "../../../server/routers";

export const trpc = createTRPCReact<AppRouter>();

// ✅ QueryClient com configuração de retry — sem isso, erros de rede
// fazem o React Query tentar 3x por padrão, incluindo erros 401/403
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Não tenta de novo em erros de autenticação/autorização
        if (error?.data?.code === "UNAUTHORIZED") return false;
        if (error?.data?.code === "FORBIDDEN") return false;
        return failureCount < 2;
      },
      staleTime: 1000 * 30, // 30 segundos antes de refetch automático
    },
  },
});

// ✅ trpcClient aponta para o endpoint do servidor
// superjson como transformer — consistente com o servidor (server/_core/trpc.ts)
export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",           // ajuste se seu endpoint for diferente
      transformer: superjson,
    }),
  ],
});