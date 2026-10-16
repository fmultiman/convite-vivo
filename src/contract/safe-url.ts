/**
 * Política de links externos: somente https, sem credenciais embutidas.
 * Bloqueia javascript:, data:, http: e similares vindos da configuração.
 */
export function isSafeExternalUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return url.protocol === "https:" && url.username === "" && url.password === "" && url.hostname.includes(".");
}

/** Link de conversa do WhatsApp com mensagem pré-preenchida. */
export function buildWhatsAppUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  const url = new URL(`https://wa.me/${digits}`);
  if (message) url.searchParams.set("text", message);
  return url.toString();
}
