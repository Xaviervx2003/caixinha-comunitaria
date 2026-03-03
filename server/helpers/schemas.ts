import { z } from "zod";

/**
 * Meses válidos para pagamento.
 * Evita strings arbitrárias como "XPTO" ou "13" entrarem no banco.
 */
export const VALID_MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

export type ValidMonth = (typeof VALID_MONTHS)[number];

const currentYear = new Date().getFullYear();

/** Campo de mês validado */
export const monthSchema = z.enum(VALID_MONTHS);

/** Campo de ano validado — entre 2020 e ano atual + 1 */
export const yearSchema = z
  .number()
  .int("Ano deve ser um inteiro.")
  .min(2020, "Ano inválido: mínimo 2020.")
  .max(currentYear + 1, "Ano não pode ser mais de 1 ano no futuro.");

/** Valor monetário positivo com até 2 casas decimais */
export const moneySchema = (label = "Valor") =>
  z
    .number()
    .positive(`${label} deve ser positivo.`)
    .max(999_999.99, `${label} excede o limite permitido (R$ 999.999,99).`)
    .refine(
      v => Number((v * 100).toFixed(0)) === Math.round(v * 100),
      `${label} deve ter no máximo 2 casas decimais.`
    );

/** Valor monetário que pode ser zero (ex.: totalLoan inicial) */
export const moneyOrZeroSchema = (label = "Valor") =>
  z
    .number()
    .min(0, `${label} não pode ser negativo.`)
    .max(999_999.99, `${label} excede o limite permitido.`)
    .refine(
      v => Number((v * 100).toFixed(0)) === Math.round(v * 100),
      `${label} deve ter no máximo 2 casas decimais.`
    );
