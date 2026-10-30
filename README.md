# Nosso Futuro

Fundação de uma plataforma de finanças pessoais e compartilhadas para casais, originalmente chamada **organiza.ai**. Nosso norte é ajudar na vida financeira e preparar o casamento. Mascotes e gamificação apoiarão hábitos saudáveis.

**Aplicação privada publicada para uso do casal:** [abrir Nosso Futuro](https://organiza-ai-rust.vercel.app). Início, Finanças e Desafios usam dados persistentes quando há sessão e vínculo ativo; Planejamento mantém estimativas separadas de pagamentos e reservas efetivos. Sem sessão, o ambiente local permite explorar uma demonstração fictícia; o endereço publicado exige login.

Em 30/10/2026, as duas contas, o vínculo, os 18 itens de planejamento e a conta com saldo inicial foram migrados ao Supabase remoto, preservando as senhas. O usuário confirmou que conseguiu entrar com sua conta e com a de Letícia e que as fotos de perfil funcionaram. Essa confirmação cobre acesso e fotos; a observação dos demais fluxos continuará durante o uso.

Disponível: contas, receitas, despesas, transferências, reservas e reversões; planejamento individual compartilhado para leitura; escolha de mascote, roupas, moedas virtuais e revisão semanal; fotos privadas de perfil. Antes de registrar movimentações, conferir conta, saldo inicial e data de corte.

Pendências principais: configurar e validar recuperação de senha por e-mail externo, backup/restauração e exportação, regras de saída/retenção. A integração GitHub/Vercel foi conectada em 30/10/2026 após autorização do aplicativo no repositório; os pushes na branch de produção devem disparar a publicação no plano Hobby. O ambiente local e o online não sincronizam dados automaticamente.

## Executar localmente

Requer Node.js 24 LTS e npm. Ambiente inicial: Node 24.21.0 e npm 11.19.0.

```bash
npm ci
# Neste ambiente, a CLI já preencheu .env.local para o Supabase de desenvolvimento.
# Só copie o exemplo se o arquivo ainda não existir e você for usar apenas a demonstração.
npm run dev
```

Abrir http://localhost:3000, especialmente para autenticação (o mesmo host deve ser usado em todo o fluxo). Variáveis podem permanecer vazias para explorar a demonstração. Não é necessário contratar serviço ou fornecer credenciais para esse modo. Para produção local: `npm run build` e `npm start`.

## O que experimentar

- Sem login: explorar o início, finanças e desafio fictícios, sem persistência.
- Com login e vínculo: conferir contas/saldo livre, registrar e reverter receitas/despesas/transferências em `/financas` e reservar/reverter números em `/desafios`.
- Perfil e Minha conta: salvar, trocar ou remover sua foto privada e consultar o vínculo. O seletor de participante fictício existe apenas na demonstração.
- Mascotes: escolha persistente de gato/cachorro, cinco roupas e chapéus, compras/equipamentos com moedas virtuais e revisão semanal (+5 moedas, +20 XP).

O atalho Registrar está disponível no celular. Moedas virtuais e XP vêm da revisão semanal autodeclarada do planejamento; roupas são cosméticas e não usam dinheiro real. Voz, IA, notificações, Realtime e operações offline não estão implementados.

## Supabase de desenvolvimento

1. Este repositório já está vinculado a um projeto separado de desenvolvimento, criado pela CLI em São Paulo. Para criar outro ambiente, use uma organização Supabase e projeto exclusivamente de desenvolvimento.
2. A configuração local da CLI está em `supabase/config.toml`. Para vincular outro projeto, autentique com `npx supabase login` e use `npx supabase link --project-ref SEU_PROJECT_REF`. Não coloque senha do banco no repositório.
3. Em 27/10/2026, as oito migrations versionadas até `202610220006` foram aplicadas também ao projeto remoto de desenvolvimento; em 30/10 foram aplicadas ainda `202610300001_mascot_wardrobe.sql` e `202610300002_profile_photos.sql`; lint SQL remoto passou. Para aplicar novas migrations, confira primeiro `npx supabase db push --dry-run`; só então rode `npx supabase db push`. O fluxo registra o histórico remoto. Não aplicar primeiro pelo SQL Editor nem apontar para produção.
4. `.env.local` aponta a aplicação para o Supabase local com URL e **publishable key** locais; pode conter também metadados privados acrescentados pela CLI da hospedagem. Dados públicos do projeto remoto e credenciais administrativas ficam em `supabase/.env.local`, também ignorado pelo Git. Nunca utilizar `service_role`, secret key, senha PostgreSQL ou chave de IA nas variáveis `NEXT_PUBLIC_*`; não substituir os arquivos locais pelo exemplo.
5. Cadastros públicos estão desativados por `[auth].enable_signup = false`. O provedor de e-mail deve continuar ativo com `[auth.email].enable_signup = true`; desativá-lo bloqueia também login por senha e recuperação (`email_provider_disabled`). As duas contas existem no ambiente local e foram migradas ao remoto em 30/10/2026, com perfis e vínculo ativo. A escolha de mascote é individual e alterável. O Mailpit local está em http://127.0.0.1:54324; não envia mensagens aos provedores de e-mail externos.
6. `/entrar` permite login por e-mail/senha e oferece `/recuperar-senha`. Em ambiente local, o link de recuperação chega ao Mailpit em `http://127.0.0.1:54324`; a confirmação abre `/nova-senha`. Em `/conta`, cada pessoa vê seu perfil e o vínculo ativo. O fluxo genérico permite criar perfil, espaço e convite pelo aplicativo; um convite pendente expira em 30 dias. `/planejamento` permite que cada pessoa edite suas próprias estimativas mensais e leia as do casal. Início, finanças e desafio consultam o banco local quando a sessão e o vínculo estão ativos. O onboarding e o planejamento não registram pagamentos ou aportes.
7. Inicie o conjunto leve de serviços necessários ao banco e Auth:

```bash
npx supabase start --exclude realtime,storage-api,imgproxy,postgres-meta,studio,edge-runtime,logflare,vector,supavisor
```

O endpoint local é `http://127.0.0.1:54321`; Postgres fica em `127.0.0.1:54322`. Pare sem apagar os dados com `npx supabase stop`.

8. Execute o teste SQL em instalação LOCAL descartável dentro do container Postgres:

```bash
docker exec -i supabase_db_nosso-futuro psql -U postgres -d postgres -v ON_ERROR_STOP=1 < supabase/tests/isolation.sql
docker exec -i supabase_db_nosso-futuro psql -U postgres -d postgres -v ON_ERROR_STOP=1 < supabase/tests/campaign_integrity.sql
docker exec -i supabase_db_nosso-futuro psql -U postgres -d postgres -v ON_ERROR_STOP=1 < supabase/tests/financial_operations.sql
```

Os testes usam fixtures sintéticas e rollback. INSERT/UPDATE/DELETE diretos nas tabelas financeiras continuam bloqueados para clientes; as operações autenticadas passam por RPCs que validam vínculo, conta, saldo livre e idempotência. Realtime, exportação e política de saída/retenção seguem pendentes. Políticas e limites estão em [ARCHITECTURE](docs/ARCHITECTURE.md).

## Validar

```bash
npm run typecheck
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Playwright inicia `npm start`; exige build já gerado e porta 3000 livre. Executar sem variáveis Supabase nos cenários de ausência de configuração. Pode precisar de bibliotecas de sistema do Chromium no Linux. Testes cobrem centavos, transferências/reservas, domínio de autorização, desafio, recompensas, formulários e navegação mobile/desktop. Testes de domínio não equivalem à validação PostgreSQL.

Para usar um Chrome já instalado, definir `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` com o caminho do executável. Neste ambiente: `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/google-chrome npm run test:e2e`.

Resultados e limitações em [VALIDATION](docs/VALIDATION.md). A revisão de intuitividade e a lista de observações para o uso estão em [Relatório UX/UI](docs/UX_UI_REVIEW.md). A base PWA possui manifest, ícones e metadados; sem cache financeiro offline ou sincronização de operações.

## Publicar para uso do casal

Primeira publicação: https://organiza-ai-rust.vercel.app, projeto `organiza-ai`, espaço Vercel Hobby. Produção/preview usam o Supabase remoto e `APP_PRIVATE=true`; visitantes são enviados a `/entrar`. `APP_URL` usa a origem pública. O ambiente local mantém sua demonstração e o Supabase local. A primeira publicação foi feita diretamente pela CLI. Em 30/10/2026, o repositório GitHub `enzoodantas/organiza.ai` foi conectado ao projeto Vercel para publicação automática a partir da branch de produção `main`.

A publicação exige um servidor Node.js 24 (Azure App Service, Vercel ou equivalente) e Supabase remoto ativo. `npm run build` usa Webpack; `npm run build:deploy` gera a saída standalone para hospedagem Node. A migração autorizada de 30/10/2026 levou as duas contas existentes e o planejamento ao remoto; novos dados locais não são sincronizados automaticamente.

1. Reativar o projeto Supabase pelo dashboard e conferir migrações com `npx supabase migration list --linked`. Revisar `npx supabase db push --dry-run` antes de aplicar as migrações pendentes ao destino correto.
2. Configurar SMTP externo no Auth, manter cadastro público desativado e provedor de e-mail ativo. Definir **Site URL** como a origem HTTPS final e permitir o retorno exato `/auth/callback?next=/nova-senha`. Configurar templates de convite e recuperação com os arquivos em `supabase/templates/`. Não executar `supabase config push` com o config local, que aponta para localhost.
3. Definir no ambiente de build e runtime `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` do remoto e `APP_URL` com a origem pública final. Não usar `.env.local` do desenvolvimento. Nunca usar chave administrativa em variáveis públicas.
4. Executar `npm run deploy:check`, `npm run build:deploy` e `npm run deploy:package`. O primeiro verifica configuração e disponibilidade do Auth; não substitui teste de migrações, SMTP ou login. O pacote fica em `.deploy/release-<instante>/`, sem arquivos de contexto/ambiente. Na hospedagem Node, iniciar na raiz do pacote com `HOSTNAME=0.0.0.0 PORT=8080 node server.js`, ajustando a porta ao provedor. No Vercel, usar integração Next e `npm run build`, com as mesmas variáveis remotas.
5. Login das duas contas e fotos foram confirmados pelo usuário em 30/10/2026. Ainda validar recuperação externa, conferir contas/saldos/data de corte e observar registro/reversão no uso do casal. Confirmar o procedimento de backup/exportação e saída/retenção antes de importar histórico pessoal.

No plano gratuito do Supabase, manter backups externos com `supabase db dump` e testar restauração em ambiente isolado. Exportação de dados da aplicação não substitui um backup completo de Auth/schema/dados. Referências: [SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [backups](https://supabase.com/docs/guides/platform/backups), [Next standalone](https://nextjs.org/docs/app/api-reference/config/next-config-js/output).

## Planejamento

- [PRD: propósito, requisitos e regras](docs/PRD.md)
- [Arquitetura: estrutura, dados e acesso](docs/ARCHITECTURE.md)
- [Roadmap: sprints e decisões abertas](docs/ROADMAP.md)
- [Validação e limites da entrega](docs/VALIDATION.md)

## Licença

Licença de distribuição do produto ainda não definida; todos os direitos reservados. Mascotes e ícone foram desenhados para este projeto. Dependências mantêm suas licenças originais; Button segue o padrão de composição do shadcn/ui (MIT), sem assets de jogos de terceiros.

### Fotos de perfil

Em Perfil ou Minha conta, cada pessoa pode escolher, conferir a prévia, salvar, substituir ou remover sua foto. A imagem é recortada pelo centro e reprocessada no navegador para JPEG de 192 × 192 px, até 32 KiB (cerca de 43 KiB em base64). Uma miniatura por conta é mantida numa tabela separada; o original e seus metadados não são enviados. JPG, PNG e WebP de até 8 MiB são aceitos como origem. A foto aparece no cabeçalho, na lateral e na identificação dos participantes em Minha conta; sem foto, são exibidas iniciais. RLS permite leitura apenas pelo dono e parceiro ativo; a RPC altera somente o próprio usuário. Fotos não são públicas nem entram nas consultas financeiras. Migração: `202610300002_profile_photos.sql`. Testes: `supabase/tests/profile_photos.sql` e `node tests/profile-photo-smoke.mjs` (local e sintético).
