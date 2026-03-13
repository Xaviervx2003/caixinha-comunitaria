// client/src/components/home/LucrosSection.tsx
import { trpc } from '@/lib/trpc';
import { formatCurrency } from '@/lib/format-currency';
const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
import { TrendingUp, DollarSign, PiggyBank, BarChart2, Users } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function LucrosSection() {
  const { data: balancete } = trpc.caixinha.getBalancete.useQuery() as { data: any };
  const { data: monthlyHistory = [] } = trpc.caixinha.getMonthlySummaryHistory.useQuery({ limit: 24 }) as { data: any[] };
  const { data: participants = [] } = trpc.caixinha.listParticipants.useQuery() as { data: any[] };

  const totalRendimentos = parseFloat(balancete?.totalRendimentos || '0');
  const caixaLivre = parseFloat(balancete?.caixaLivre || '0');
  const contasAReceber = parseFloat(balancete?.contasAReceber || '0');
  const patrimonioTotal = parseFloat(balancete?.patrimonioTotal || '0');

  // Membros que participam da distribuição (role === 'member')
  const membros = participants.filter((p: any) => (p.role ?? 'member') === 'member');
  const lucroLiquido = Math.max(0, totalRendimentos);
  const porMembro = membros.length > 0 ? lucroLiquido / membros.length : 0;

  // Dados para gráfico
  const chartData = [...monthlyHistory].reverse().map((s: any) => {
    const [, m] = (s.month || '').split('-');
    return {
      name: MONTH_NAMES[parseInt(m) - 1]?.slice(0, 3) || s.month,
      arrecadado: parseFloat(s.totalCollected || '0'),
      patrimonio: parseFloat(s.closingBalance || '0'),
    };
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Cards de Patrimônio */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Caixa Livre', value: formatCurrency(caixaLivre), icon: DollarSign, color: '#00C853', bg: '#dcfce7' },
          { label: 'Contas a Receber', value: formatCurrency(contasAReceber), icon: TrendingUp, color: '#F59E0B', bg: '#fef3c7' },
          { label: 'Patrimônio Total', value: formatCurrency(patrimonioTotal), icon: PiggyBank, color: '#8B5CF6', bg: '#ede9fe' },
          { label: 'Rendimentos', value: formatCurrency(totalRendimentos), icon: BarChart2, color: '#06B6D4', bg: '#e0f2fe' },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{stat.label}</p>
                <div className="p-2 rounded-lg" style={{ backgroundColor: stat.bg }}>
                  <Icon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
              </div>
              <p className="text-xl font-black" style={{ color: stat.color }}>{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Gráfico de Tendência */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-black text-gray-800 mb-1">Tendência Mensal</h3>
          <p className="text-xs text-gray-400 mb-5">Arrecadação e patrimônio ao longo dos meses</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gradArrecadado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00C853" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#00C853" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradPatrimonio" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => formatCurrency(v)} />
              <Area type="monotone" dataKey="arrecadado" name="Arrecadado" stroke="#00C853" fill="url(#gradArrecadado)" strokeWidth={2} />
              <Area type="monotone" dataKey="patrimonio" name="Patrimônio" stroke="#8B5CF6" fill="url(#gradPatrimonio)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Distribuição por Membro */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#00C853]" />
            <h3 className="font-black text-gray-800 text-sm uppercase tracking-wide">
              Distribuição de Lucros por Membro
            </h3>
          </div>
          <span className="text-xs text-gray-400 font-bold">{membros.length} membros</span>
        </div>

        {membros.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <p className="font-bold">Nenhum membro cadastrado</p>
          </div>
        ) : (
          <>
            {/* Resumo */}
            <div className="bg-[#0F1117] px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Lucro líquido total</p>
                <p className="text-2xl font-black text-[#00C853]">{formatCurrency(lucroLiquido)}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Por membro</p>
                <p className="text-2xl font-black text-white">{formatCurrency(porMembro)}</p>
              </div>
            </div>

            {/* Lista */}
            <div className="divide-y divide-gray-50">
              {membros.map((p: any, i: number) => {
                const debt = parseFloat(p.currentDebt?.toString() || '0');
                const payoutLiquido = Math.max(0, porMembro - debt);
                return (
                  <div key={p.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50">
                    <span className="text-xs font-black text-gray-400 w-5">{i + 1}</span>
                    <div className="w-9 h-9 rounded-full bg-[#00C853]/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-black text-[#00C853]">{p.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">{p.name}</p>
                      {debt > 0 && (
                        <p className="text-xs text-red-400 font-bold">Dívida: {formatCurrency(debt)}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-[#00C853]">{formatCurrency(porMembro)}</p>
                      {debt > 0 && (
                        <p className="text-xs text-gray-400 font-bold">Líquido: {formatCurrency(payoutLiquido)}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Histórico de Ciclos Fechados */}
      {monthlyHistory.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-black text-gray-800 text-sm uppercase tracking-wide">Ciclos Fechados</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {[...monthlyHistory].reverse().map((s: any) => {
              const [year, month] = (s.month || '').split('-');
              const monthName = MONTH_NAMES[parseInt(month) - 1] || s.month;
              return (
                <div key={s.month} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-bold text-gray-800">{monthName} {year}</p>
                    <p className="text-xs text-gray-400">{s.totalParticipants ?? '—'} participantes</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-[#00C853]">
                      {formatCurrency(parseFloat(s.totalCollected || '0'))}
                    </p>
                    <p className="text-xs text-gray-400">arrecadado</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
