import { getLoginUrl } from "@/const";
import { useCallback, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  // Aqui criamos o seu Passe Livre permanente de Administrador!
  const mockUser = {
    id: 1,
    openId: "admin-local",
    name: "João Victor",
    email: "joao@caixinha.local",
    loginMethod: "local",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const logout = useCallback(async () => {
    console.log("Logout desativado no modo local.");
  }, []);

  const state = useMemo(() => {
    return {
      user: mockUser,
      loading: false,
      error: null,
      isAuthenticated: true, // O sistema sempre vai achar que você está logado
    };
  }, []);

  return {
    ...state,
    refresh: () => {},
    logout,
  };
}