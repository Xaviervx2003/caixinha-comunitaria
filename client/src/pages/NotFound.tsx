// ✅ Sem dependência de shadcn/ui — funciona imediatamente
import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-lg mx-4 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-8 text-center">

        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-red-100 rounded-full animate-pulse" />
            <AlertCircle className="relative h-16 w-16 text-red-500" />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-slate-900 mb-2">404</h1>

        <h2 className="text-xl font-semibold text-slate-700 mb-4">
          Página não encontrada
        </h2>

        <p className="text-slate-600 mb-8 leading-relaxed">
          A página que você está procurando não existe.
          <br />
          Ela pode ter sido movida ou deletada.
        </p>

        <button
          onClick={() => setLocation("/")}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg font-medium"
        >
          <Home className="w-4 h-4" />
          Voltar ao início
        </button>

      </div>
    </div>
  );
}