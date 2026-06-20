export function normalizeBR(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) return `+${digits}`;
  if (digits.length === 10 || digits.length === 11) return `+55${digits}`;
  if (digits.length >= 11 && digits.length <= 15) return `+${digits}`;
  return null;
}

export type ParsedContact = { phone_e164: string; phone_raw: string; name?: string; empresa?: string };

export function parseContactsCSV(input: string): { contacts: ParsedContact[]; invalid: string[] } {
  const contacts: ParsedContact[] = [];
  const invalid: string[] = [];
  for (const raw of input.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const [phone, name, empresa] = line.split(",").map((s) => s?.trim() ?? "");
    const norm = normalizeBR(phone);
    if (!norm) {
      invalid.push(line);
      continue;
    }
    contacts.push({
      phone_e164: norm,
      phone_raw: phone,
      name: name || undefined,
      empresa: empresa || undefined,
    });
  }
  return { contacts, invalid };
}
