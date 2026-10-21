import { test, expect } from "@playwright/test";
test("navegação e registro financeiro fictício", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Cuidar do hoje. Sonhar a dois." })).toBeVisible();
  await expect(page.getByText("Dados fictícios para explorar", { exact: false })).toBeVisible();
  await page.getByRole("link", { name: "Registrar movimentação" }).click();
  await page.getByLabel("Descrição").fill("Compra de teste");
  await page.getByLabel("Valor (R$)").fill("22,90");
  await page.getByRole("button", { name: "Adicionar à demonstração" }).click();
  await expect(page.getByRole("status")).toContainText("somente à demonstração");
  await expect(page.getByText("Compra de teste", { exact: true })).toBeVisible();
  for (const route of ["/desafios", "/mascotes", "/perfil", "/entrar"]) {
    await page.goto(route); await expect(page.locator("h1")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  await page.goto("/conta"); await expect(page).toHaveURL(/\/entrar/);
  expect(errors).toEqual([]);
});
test("aporte duplicado, reversão e isolamento da demonstração após recarregar", async ({ page }) => {
  await page.goto("/desafios"); await page.getByLabel("Número de 1 a 200").fill("20");
  await page.getByRole("button", { name: "Registrar aporte fictício" }).click(); await expect(page.locator("main").getByRole("alert")).toContainText("já recebeu");
  await page.getByLabel("Número de 1 a 200").fill("1"); await page.getByRole("button", { name: "Registrar aporte fictício" }).click();
  await expect(page.getByText("9/200 números")).toBeVisible();
  await page.getByRole("button", { name: "Reverter aporte 1", exact: true }).click();
  await expect(page.getByText("8/200 números")).toBeVisible();
  await page.reload(); await expect(page.getByText("8/200 números")).toBeVisible();
});
test("tela de 320px mantém conteúdo acessível e movimento reduzido", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 }); await page.emulateMedia({ reducedMotion: "reduce" });
  for (const route of ["/", "/financas", "/desafios", "/mascotes", "/perfil"]) {
    await page.goto(route); expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});
test("parceira vê dados individuais mas só altera os próprios", async ({ page }) => {
  await page.goto("/perfil");
  await page.getByLabel("Participante da demonstração").selectOption("b");
  await page.locator("nav:visible").getByRole("link", { name: "Finanças", exact: true }).click();
  await expect(page.getByText("Receita de exemplo • Enzo", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Reverter Receita de exemplo • Enzo", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Reverter Receita de exemplo • Letícia", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Reverter Moradia de exemplo", exact: true })).toBeVisible();
});
test("manifest e ícones PWA respondem", async ({ request }) => {
  const response = await request.get("/manifest.webmanifest"); expect(response.ok()).toBe(true);
  const manifest = await response.json(); expect(manifest.display).toBe("standalone");
  for (const icon of manifest.icons) expect((await request.get(icon.src)).ok()).toBe(true);
});
