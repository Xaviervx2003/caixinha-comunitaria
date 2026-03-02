/**
 * Formata um valor numérico como moeda brasileira (R$)
 * @param value - Valor a ser formatado (número ou string)
 * @param decimals - Número de casas decimais (padrão: 2)
 * @returns String formatada como "R$ 1.234,56"
 */
export function formatCurrency(value: number | string | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined) {
    return 'R$ 0,00';
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return 'R$ 0,00';
  }

  // Formatar com casas decimais
  const formatted = numValue.toFixed(decimals);

  // Separar inteira e decimal
  const [integerPart, decimalPart] = formatted.split('.');

  // Adicionar separador de milhar
  const withThousandsSeparator = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  // Retornar com símbolo R$ e separador de decimal como vírgula
  return `R$ ${withThousandsSeparator},${decimalPart}`;
}

/**
 * Formata um valor numérico como percentual
 * @param value - Valor a ser formatado (número ou string)
 * @param decimals - Número de casas decimais (padrão: 1)
 * @returns String formatada como "12,5%"
 */
export function formatPercentage(value: number | string | null | undefined, decimals: number = 1): string {
  if (value === null || value === undefined) {
    return '0,0%';
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return '0,0%';
  }

  return `${numValue.toFixed(decimals).replace('.', ',')}%`;
}

/**
 * Converte um valor de moeda formatada de volta para número
 * @param formatted - String formatada como "R$ 1.234,56"
 * @returns Número sem formatação
 */
export function parseCurrency(formatted: string): number {
  if (!formatted) return 0;

  // Remove "R$" e espaços
  let cleaned = formatted.replace(/R\$\s?/g, '').trim();

  // Remove separador de milhar (.)
  cleaned = cleaned.replace(/\./g, '');

  // Substitui vírgula por ponto para parseFloat
  cleaned = cleaned.replace(',', '.');

  return parseFloat(cleaned) || 0;
}
