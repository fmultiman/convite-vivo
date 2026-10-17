import { afterEach, describe, expect, it, vi } from "vitest";
import { getSiteUrl } from "@/lib/site";

describe("URL base do site", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("usa o domínio configurado quando existe", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://convite.example.com");
    vi.stubEnv("VERCEL_URL", "convite-abc.vercel.app");
    expect(getSiteUrl().origin).toBe("https://convite.example.com");
  });

  it("cai para a URL do deployment na Vercel (nunca localhost em preview)", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_URL", "convite-abc.vercel.app");
    expect(getSiteUrl().origin).toBe("https://convite-abc.vercel.app");
  });

  it("usa localhost só quando não há nenhuma das duas", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_URL", "");
    expect(getSiteUrl().origin).toBe("http://localhost:3000");
  });
});
