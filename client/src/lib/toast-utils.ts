import { toast } from 'sonner';

const toastConfig = {
  className: 'border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none font-bold',
};

/**
 * Exibe um toast de sucesso com ícone
 */
export function showSuccessToast(message: string, description?: string) {
  toast.success(message, {
    ...toastConfig,
    description,
  });
}

/**
 * Exibe um toast de erro com ícone
 */
export function showErrorToast(message: string, description?: string) {
  toast.error(message, {
    ...toastConfig,
    description,
  });
}

/**
 * Exibe um toast de aviso com ícone
 */
export function showWarningToast(message: string, description?: string) {
  toast.warning(message, {
    ...toastConfig,
    description,
  });
}

/**
 * Exibe um toast informativo com ícone
 */
export function showInfoToast(message: string, description?: string) {
  toast.info(message, {
    ...toastConfig,
    description,
  });
}

/**
 * Exibe um toast de carregamento
 */
export function showLoadingToast(message: string, description?: string) {
  return toast.loading(message, {
    ...toastConfig,
    description,
  });
}
