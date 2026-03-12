// client/src/pages/Login.tsx
import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock } from 'lucide-react';
import { showErrorToast, showSuccessToast } from '@/lib/toast-utils';

export default function Login() {
  const [password, setPassword] = useState('');
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      showSuccessToast('Acesso Permitido!');
      utils.auth.me.invalidate(); 
      setLocation('/'); 
    },
    onError: (error) => {
      showErrorToast(error.message);
    }
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    loginMutation.mutate({ password });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-xl border-2 border-slate-200">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[#00C853] rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-[#00C853]/20">
            <Lock className="w-8 h-8 text-white stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-black text-black uppercase tracking-tight">Acesso Restrito</h1>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-2">Caixinha Comunitária</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Senha Mestra</label>
            <Input 
              type="password" 
              placeholder="Digite o código..." 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 text-center text-xl font-black tracking-widest border-2 border-slate-300 focus:border-black transition-all"
            />
          </div>
          <Button 
            type="submit" 
            disabled={loginMutation.isPending}
            className="w-full h-14 bg-black text-white hover:bg-gray-800 text-sm font-black uppercase tracking-widest rounded-xl transition-all"
          >
            {loginMutation.isPending ? 'VERIFICANDO...' : 'ENTRAR'}
          </Button>
        </form>
      </div>
    </div>
  );
}