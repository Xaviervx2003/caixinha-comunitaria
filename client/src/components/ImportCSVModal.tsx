import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { processCSVImport, ImportedParticipant, ImportedTransaction, ImportedMonthlyPayment } from '@/lib/csv-import';

interface ImportCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (participants: ImportedParticipant[], transactions: ImportedTransaction[], monthlyPayments?: ImportedMonthlyPayment[]) => Promise<void>;
}

export function ImportCSVModal({ isOpen, onClose, onImport }: ImportCSVModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<{
    participants: ImportedParticipant[];
    transactions: ImportedTransaction[];
    monthlyPayments: ImportedMonthlyPayment[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const data = await processCSVImport(file);
      setSelectedFile(file);
      setImportData(data);
      toast.success(`Arquivo carregado: ${data.participants.length} participantes, ${data.transactions.length} transações, ${data.monthlyPayments.length} pagamentos`, {
        className: 'border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none font-bold',
      });
    } catch (error) {
      toast.error(`Erro ao processar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, {
        className: 'border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none font-bold',
      });
      setSelectedFile(null);
      setImportData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importData) return;

    try {
      setIsLoading(true);
      await onImport(importData.participants, importData.transactions, importData.monthlyPayments);
      toast.success('Dados restaurados com sucesso!', {
        className: 'border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none font-bold',
      });
      handleClose();
    } catch (error) {
      toast.error(`Erro ao restaurar dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, {
        className: 'border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none font-bold',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setImportData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase">Importar Backup</DialogTitle>
          <DialogDescription className="text-sm font-semibold">
            Restaure seus dados a partir de um arquivo CSV de backup
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Aviso */}
          <div className="bg-yellow-100 border-2 border-yellow-600 p-3 rounded-none flex gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm font-semibold">
              <p className="font-bold">Atenção!</p>
              <p className="text-xs mt-1">Esta ação vai restaurar todos os dados do backup. Dados atuais podem ser sobrescritos.</p>
            </div>
          </div>

          {/* File Input */}
          <div>
            <label className="block text-sm font-bold mb-2 uppercase">Selecione o arquivo CSV</label>
            <div className="border-2 border-dashed border-black p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors rounded-none"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm font-bold">{selectedFile ? selectedFile.name : 'Clique para selecionar ou arraste um arquivo'}</p>
              <p className="text-xs text-gray-600 mt-1">Apenas arquivos CSV (máximo 10MB)</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isLoading}
            />
          </div>

          {/* Preview */}
          {importData && (
            <div className="bg-blue-50 border-2 border-blue-400 p-3 rounded-none">
              <p className="text-sm font-bold mb-2">Dados a restaurar:</p>
              <ul className="text-xs space-y-1">
                <li>✓ {importData.participants.length} participante(s)</li>
                <li>✓ {importData.transactions.length} transação(ões)</li>
                <li>✓ {importData.monthlyPayments.length} pagamento(s) mensal(is)</li>
              </ul>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            onClick={handleClose}
            variant="outline"
            className="border-2 border-black rounded-none font-bold uppercase"
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={!importData || isLoading}
            className="bg-green-600 text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all rounded-none font-bold uppercase disabled:opacity-50"
          >
            {isLoading ? 'Restaurando...' : 'Restaurar Dados'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
