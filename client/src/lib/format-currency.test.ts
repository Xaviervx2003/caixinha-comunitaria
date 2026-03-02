import { describe, it, expect } from 'vitest';
import { formatCurrency, formatPercentage, parseCurrency } from './format-currency';

describe('formatCurrency', () => {
  it('deve formatar número como moeda brasileira', () => {
    expect(formatCurrency(1234.56)).toBe('R$ 1.234,56');
  });

  it('deve formatar número inteiro com duas casas decimais', () => {
    expect(formatCurrency(1000)).toBe('R$ 1.000,00');
  });

  it('deve formatar zero corretamente', () => {
    expect(formatCurrency(0)).toBe('R$ 0,00');
  });

  it('deve formatar valores pequenos com vírgula', () => {
    expect(formatCurrency(10.5)).toBe('R$ 10,50');
  });

  it('deve formatar valores grandes com separador de milhar', () => {
    expect(formatCurrency(1000000)).toBe('R$ 1.000.000,00');
  });

  it('deve aceitar string como entrada', () => {
    expect(formatCurrency('1234.56')).toBe('R$ 1.234,56');
  });

  it('deve retornar R$ 0,00 para null', () => {
    expect(formatCurrency(null)).toBe('R$ 0,00');
  });

  it('deve retornar R$ 0,00 para undefined', () => {
    expect(formatCurrency(undefined)).toBe('R$ 0,00');
  });

  it('deve retornar R$ 0,00 para string inválida', () => {
    expect(formatCurrency('abc')).toBe('R$ 0,00');
  });

  it('deve respeitar número de casas decimais customizado', () => {
    expect(formatCurrency(1234.567, 1)).toBe('R$ 1.234,6');
    expect(formatCurrency(1234.567, 3)).toBe('R$ 1.234,567');
  });
});

describe('formatPercentage', () => {
  it('deve formatar número como percentual', () => {
    expect(formatPercentage(12.5)).toBe('12,5%');
  });

  it('deve formatar zero como percentual', () => {
    expect(formatPercentage(0)).toBe('0,0%');
  });

  it('deve aceitar string como entrada', () => {
    expect(formatPercentage('25.5')).toBe('25,5%');
  });

  it('deve retornar 0,0% para null', () => {
    expect(formatPercentage(null)).toBe('0,0%');
  });

  it('deve respeitar número de casas decimais customizado', () => {
    expect(formatPercentage(12.567, 2)).toBe('12,57%');
  });
});

describe('parseCurrency', () => {
  it('deve converter moeda formatada para número', () => {
    expect(parseCurrency('R$ 1.234,56')).toBe(1234.56);
  });

  it('deve converter moeda sem espaço após R$', () => {
    expect(parseCurrency('R$1.234,56')).toBe(1234.56);
  });

  it('deve converter moeda com valores grandes', () => {
    expect(parseCurrency('R$ 1.000.000,00')).toBe(1000000);
  });

  it('deve retornar 0 para string vazia', () => {
    expect(parseCurrency('')).toBe(0);
  });

  it('deve retornar 0 para string inválida', () => {
    expect(parseCurrency('abc')).toBe(0);
  });

  it('deve converter moeda com centavos', () => {
    expect(parseCurrency('R$ 10,50')).toBe(10.5);
  });
});
