// client/src/components/home/HomeSidebar.tsx
import { cn } from '@/lib/utils';
import { PiggyBank, LogOut, X } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface NavItem {
  id: string;
  label: string;
  icon: any;
  badge?: string;
}

interface HomeSidebarProps {
  sidebarOpen: boolean;
  activeSection: string;
  navItems: NavItem[];
  debtors: number;
  userName?: string | null;
  onSelectSection: (section: any) => void;
}

export function HomeSidebar({
  sidebarOpen,
  activeSection,
  navItems,
  debtors,
  userName,
  onSelectSection,
}: HomeSidebarProps) {
  const utils = trpc.useUtils();

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
    },
  });

  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-30 w-64 bg-[#0F1117] flex flex-col transition-transform duration-300",
      "lg:relative lg:translate-x-0",
      sidebarOpen ? "translate-x-0" : "-translate-x-full"
    )}>

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="bg-[#00C853] p-2 rounded-lg flex-shrink-0">
          <PiggyBank className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-black text-sm truncate">Caixinha</p>
          <p className="text-[#00C853] text-xs font-bold uppercase tracking-widest">Comunitária</p>
        </div>
        {/* Botão fechar no mobile */}
        <button
          onClick={() => onSelectSection(activeSection)}
          className="lg:hidden text-gray-400 hover:text-white p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          const showBadge = item.id === 'devedores' && debtors > 0;

          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all text-left",
                isActive
                  ? "bg-[#00C853] text-white shadow-lg shadow-[#00C853]/20"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {showBadge && (
                <span className={cn(
                  "text-xs font-black px-1.5 py-0.5 rounded-full min-w-[20px] text-center",
                  isActive ? "bg-white/20 text-white" : "bg-red-500 text-white"
                )}>
                  {debtors}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Rodapé com usuário e logout */}
      <div className="px-3 py-4 border-t border-white/10 space-y-2">
        {/* Info do usuário */}
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-[#00C853]/20 flex items-center justify-center flex-shrink-0">
            <span className="text-[#00C853] text-xs font-black">
              {userName?.charAt(0)?.toUpperCase() ?? 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-bold truncate">{userName ?? 'Usuário'}</p>
            <p className="text-gray-500 text-xs">Administrador</p>
          </div>
        </div>

        {/* Botão Logout */}
        <button
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>{logoutMutation.isPending ? 'Saindo...' : 'Sair'}</span>
        </button>
      </div>
    </aside>
  );
}
