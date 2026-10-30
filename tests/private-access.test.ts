import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { claims, config } = vi.hoisted(() => ({ claims: vi.fn(), config: vi.fn() }));
vi.mock("@supabase/ssr", () => ({ createServerClient: () => ({ auth: { getClaims: claims } }) }));
vi.mock("@/lib/supabase/config", () => ({ supabaseConfig: config }));
import { proxy } from "@/proxy";

describe("acesso privado do deploy", () => {
  beforeEach(() => {
    vi.stubEnv("APP_PRIVATE", "true");
    config.mockReturnValue({ url: "https://synthetic.supabase.co", key: "synthetic" });
    claims.mockResolvedValue({ data: null });
  });
  afterEach(() => vi.unstubAllEnvs());

  it("exige sessão nas áreas do casal", async () => {
    for (const path of ["/", "/financas", "/planejamento", "/desafios", "/perfil", "/mascotes", "/conta"]) {
      const response = await proxy(new NextRequest(`https://app.example.com${path}`));
      expect(response.headers.get("location")).toBe("https://app.example.com/entrar");
      expect(response.headers.get("cache-control")).toContain("no-store");
    }
  });

  it("mantém entrada, convite e recuperação disponíveis", async () => {
    for (const path of ["/entrar", "/recuperar-senha", "/convite", "/auth/confirm", "/auth/callback", "/nova-senha"]) {
      expect((await proxy(new NextRequest(`https://app.example.com${path}`))).status).toBe(200);
    }
  });

  it("permite sessão verificada e conserva a demonstração local", async () => {
    claims.mockResolvedValue({ data: { claims: { sub: "synthetic" } } });
    expect((await proxy(new NextRequest("https://app.example.com/financas"))).status).toBe(200);
    vi.stubEnv("APP_PRIVATE", "false");
    claims.mockResolvedValue({ data: null });
    expect((await proxy(new NextRequest("https://app.example.com/"))).status).toBe(200);
  });

  it("recusa abrir a demonstração quando falta configuração no deploy privado", async () => {
    config.mockReturnValue(null);
    expect((await proxy(new NextRequest("https://app.example.com/"))).status).toBe(503);
  });
});
