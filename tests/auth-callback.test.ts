import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { client, exchange } = vi.hoisted(() => ({ client: vi.fn(), exchange: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ serverClient: client }));
import { GET } from "@/app/auth/callback/route";

describe("retorno da recuperação por PKCE", () => {
  afterEach(() => vi.unstubAllEnvs());
  beforeEach(() => {
    client.mockResolvedValue({ auth: { exchangeCodeForSession: exchange } });
    exchange.mockReset();
    exchange.mockResolvedValue({ error: null });
  });

  it("troca o código e abre a criação de senha sem repassar o código", async () => {
    const response = await GET(new Request("https://app.example.com/auth/callback?code=synthetic&next=/nova-senha"));
    expect(exchange).toHaveBeenCalledWith("synthetic");
    expect(response.headers.get("location")).toBe("https://app.example.com/nova-senha");
    expect(response.headers.get("cache-control")).toContain("no-store");
  });

  it("impede redirecionamento externo e oferece nova tentativa quando o código expira", async () => {
    const response = await GET(new Request("https://app.example.com/auth/callback?code=synthetic&next=https://other.example.com"));
    expect(response.headers.get("location")).toBe("https://app.example.com/conta");
    exchange.mockResolvedValue({ error: { code: "expired" } });
    const expired = await GET(new Request("https://app.example.com/auth/callback?code=expired"));
    expect(expired.headers.get("location")).toBe("https://app.example.com/recuperar-senha?erro=link");
  });

  it("usa a origem pública configurada atrás do proxy da hospedagem", async () => {
    vi.stubEnv("APP_URL", "https://public.example.com");
    const response = await GET(new Request("http://internal:8080/auth/callback?code=synthetic&next=/nova-senha"));
    expect(response.headers.get("location")).toBe("https://public.example.com/nova-senha");
  });
});
