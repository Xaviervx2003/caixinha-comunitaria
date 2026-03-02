import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface DebtDataPoint {
  month: string;
  debt: number;
  paid: number;
}

interface DebtEvolutionChartProps {
  isOpen: boolean;
  onClose: () => void;
  participantName: string;
  data: DebtDataPoint[];
  initialDebt: number;
  currentDebt: number;
}

export function DebtEvolutionChart({
  isOpen,
  onClose,
  participantName,
  data,
  initialDebt,
  currentDebt,
}: DebtEvolutionChartProps) {
  // Se não houver dados, criar dados padrão
  const chartData = data.length > 0 ? data : [
    { month: 'Mês 1', debt: initialDebt, paid: 0 },
    { month: 'Mês 2', debt: currentDebt, paid: initialDebt - currentDebt },
  ];

  const amortized = initialDebt - currentDebt;
  const percentagePaid = ((amortized / initialDebt) * 100).toFixed(1);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase">Evolução de Dívida</DialogTitle>
          <DialogDescription className="text-sm font-semibold">
            {participantName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Estatísticas */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-blue-50 border-2 border-blue-400 p-3 rounded-none">
              <p className="text-xs font-bold text-blue-600 uppercase">Empréstimo Inicial</p>
              <p className="text-lg font-black">R$ {initialDebt.toFixed(2)}</p>
            </div>
            <div className="bg-green-50 border-2 border-green-400 p-3 rounded-none">
              <p className="text-xs font-bold text-green-600 uppercase">Amortizado</p>
              <p className="text-lg font-black">R$ {amortized.toFixed(2)}</p>
              <p className="text-xs font-semibold text-green-600">{percentagePaid}%</p>
            </div>
            <div className="bg-red-50 border-2 border-red-400 p-3 rounded-none">
              <p className="text-xs font-bold text-red-600 uppercase">Saldo Devedor</p>
              <p className="text-lg font-black">R$ {currentDebt.toFixed(2)}</p>
            </div>
          </div>

          {/* Gráfico */}
          <div className="border-2 border-black p-4 rounded-none bg-white">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#000" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fontWeight: 'bold' }}
                  stroke="#000"
                />
                <YAxis
                  tick={{ fontSize: 12, fontWeight: 'bold' }}
                  stroke="#000"
                  label={{ value: 'R$', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '2px solid #000',
                    borderRadius: '0',
                    fontWeight: 'bold',
                  }}
                  formatter={(value: any) => `R$ ${parseFloat(value).toFixed(2)}`}
                />
                <Legend
                  wrapperStyle={{ fontWeight: 'bold' }}
                  iconType="line"
                />
                <Line
                  type="monotone"
                  dataKey="debt"
                  stroke="#FF3D00"
                  strokeWidth={3}
                  dot={{ fill: '#FF3D00', r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Saldo Devedor"
                />
                <Line
                  type="monotone"
                  dataKey="paid"
                  stroke="#00C853"
                  strokeWidth={3}
                  dot={{ fill: '#00C853', r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Amortizado"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Informações adicionais */}
          <div className="bg-gray-50 border-2 border-gray-400 p-3 rounded-none text-xs font-semibold space-y-1">
            <p>📊 <strong>Linha Vermelha:</strong> Mostra como o saldo devedor diminui ao longo do tempo</p>
            <p>📈 <strong>Linha Verde:</strong> Mostra o valor total já amortizado/pago</p>
            <p>💡 <strong>Dica:</strong> Passe o mouse sobre o gráfico para ver valores exatos</p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={onClose}
            className="bg-black text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all rounded-none font-bold uppercase"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
