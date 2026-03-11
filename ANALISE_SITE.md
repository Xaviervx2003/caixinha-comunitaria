# Análise técnica do site (Caixinha Comunitária)

## Resumo executivo

O projeto tem uma base moderna (React 19 + tRPC + Drizzle + PWA), boa cobertura de testes unitários para utilitários críticos e build de produção funcional. Em contrapartida, existem riscos altos de segurança/autorização e alguns sinais de dívida técnica de tipagem/manutenibilidade.

## Pontos fortes

1. **Stack atual e consistente**
   - Frontend e backend em TypeScript, roteamento tRPC e build com Vite/esbuild.
2. **Funcionalidades relevantes para produto financeiro**
   - Dashboard, histórico, auditoria, export/import CSV e indicadores de inadimplência.
3. **Testes automatizados existentes e estáveis**
   - Suíte Vitest executa com sucesso (31 testes), cobrindo parsing/formatação e fluxo de logout.
4. **Build de produção estável**
   - `npm run build` conclui sem erro.

## Riscos e oportunidades

### 1) Segurança e autenticação (crítico)

Hoje tanto frontend quanto backend estão com usuário mockado e autenticação sempre habilitada:

- `client/src/_core/hooks/useAuth.ts` retorna `isAuthenticated: true` e um usuário fixo local.
- `server/_core/context.ts` injeta `mockUser` no contexto de toda requisição.

**Impacto:** qualquer pessoa com acesso à aplicação pode operar como usuário autenticado, sem fluxo real de login.

### 2) Qualidade de tipos / integridade de build de tipo (alto)

`npm run check` falha com erros de TypeScript em múltiplos pontos:

- Inconsistência de tipos no `ProtectedRoute` (`JSX` namespace).
- Imports quebrados em `use-store.ts` para símbolos não exportados de `lib/finance`.
- Referência a componente inexistente em `ComponentShowcase.tsx`.
- Incompatibilidade de tipo `AuditEntry` vs `AuditLogEntry` em `Home.tsx`.

**Impacto:** regressões passam despercebidas no editor/CI e a manutenção fica mais arriscada.

### 3) Performance de bundle (médio)

Build aponta chunk principal próximo de 1 MB minificado no frontend, com alerta explícito de code-splitting.

**Impacto:** piora de tempo de carregamento inicial, principalmente em mobile/rede lenta.

### 4) Complexidade de página principal (médio)

`Home.tsx` concentra muitas responsabilidades (layout, regras, modais, mutações, handlers), dificultando evolução e teste de comportamento.

**Impacto:** aumento de custo de manutenção e maior chance de bug em alterações futuras.

## Recomendações priorizadas

### Prioridade P0 (imediata)

1. **Remover autenticação mockada** no frontend e backend.
2. **Reativar validação real de sessão/JWT** no `createContext` do servidor.
3. **Bloquear deploy** enquanto autenticação estiver em modo local hardcoded.

### Prioridade P1 (curto prazo)

1. **Corrigir todos os erros de `npm run check`** e adicionar esse comando no pipeline CI obrigatório.
2. **Refatorar `Home.tsx`** em módulos menores (seções e hooks por domínio).
3. **Criar smoke tests** para fluxos críticos: login, adicionar participante, pagamento, amortização e reset de mês.

### Prioridade P2 (médio prazo)

1. **Aplicar lazy-loading** em páginas/áreas menos usadas para reduzir chunk inicial.
2. **Adicionar monitoramento básico** (erro em runtime e métricas de performance web-vitals).

## Comandos executados nesta análise

- `npm test` ✅
- `npm run check` ❌ (falhas de tipagem já existentes no projeto)
- `npm run build` ✅ (com alerta de chunk grande)

