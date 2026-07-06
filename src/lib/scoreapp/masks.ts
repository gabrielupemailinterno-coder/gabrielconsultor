// Formatação e parsing de números para inputs de metas.
// Todos os valores são armazenados no banco como número puro (reais em decimal, quantidades em inteiro).

export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

// Interpreta digitação livre em centavos: "R$ 1.234,56" ou "123456" -> 1234.56
export const parseCurrencyInput = (raw: string): number => {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return 0;
  return Number(digits) / 100;
};

// Máscara enquanto o usuário digita
export const maskCurrencyWhileTyping = (raw: string): string => formatCurrency(parseCurrencyInput(raw));

// Inteiros positivos (quantidades como ligações/dia)
export const parseInteger = (raw: string): number => {
  const digits = raw.replace(/\D/g, "");
  return digits ? Math.min(Number(digits), 999999) : 0;
};

export const formatInteger = (value: number): string =>
  new Intl.NumberFormat("pt-BR").format(Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0);
