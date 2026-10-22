# Nosso Futuro

Fundação de uma plataforma de finanças pessoais e compartilhadas para casais, originalmente chamada **organiza.ai**. Nosso norte é ajudar na vida financeira e preparar o casamento. Mascotes e gamificação apoiarão hábitos saudáveis.

**Sprint 01: demonstração funcional em memória + planejamento mensal persistente no banco local.** Início, finanças, desafio e mascotes continuam demonstrações com dados fictícios; as alterações dessas telas não persistem. A página `/planejamento` guarda estimativas do casal, separadas de pagamentos efetivos e de aportes ao desafio. Não use a demonstração para registrar dinheiro real. A revisão de cálculos e persistência está em [docs/FINANCIAL_AUDIT.md](docs/FINANCIAL_AUDIT.md).

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

- Início: resumo consolidado, gráfico e progresso do desafio fictícios.
- Finanças: filtrar por participante/espaço conjunto, adicionar receita/despesa e reverter registros autorizados.
- Desafios: preencher número de 1 a 200, ver responsável/progresso e reverter aporte. Duplicidades ativas são bloqueadas.
- Perfil: alternar participante fictício e observar a restrição de edição individual.
- Mascotes: prévia original do gato e cachorrinho, com evolução explicitamente futura.

O botão Registrar fica acessível no celular. Voz, itens, XP, moedas, missões e personalização não estão ativos.

## Supabase de desenvolvimento

1. Este repositório já está vinculado a um projeto separado de desenvolvimento, criado pela CLI em São Paulo. Para criar outro ambiente, use uma organização Supabase e projeto exclusivamente de desenvolvimento.
2. A configuração local da CLI está em `supabase/config.toml`. Para vincular outro projeto, autentique com `npx supabase login` e use `npx supabase link --project-ref SEU_PROJECT_REF`. Não coloque senha do banco no repositório.
3. Para aplicar migrations, confira primeiro `npx supabase db push --dry-run`; só então rode `npx supabase db push`. O fluxo registra o histórico remoto. Não aplicar primeiro pelo SQL Editor nem apontar para produção.
4. `.env.local` aponta a aplicação para o Supabase local e contém somente a URL e a **publishable key** locais. Dados públicos do projeto remoto e credenciais administrativas ficam em `supabase/.env.local`, também ignorado pelo Git. Nunca utilizar `service_role`, secret key, senha PostgreSQL ou chave de IA nas variáveis `NEXT_PUBLIC_*`; não substituir os arquivos locais pelo exemplo.
5. Cadastros públicos estão desativados. As duas contas existem somente no Auth local. Perfis Enzo/gato e Letícia/cachorro foram provisionados localmente; ambos aceitaram o espaço “Nosso Futuro”. O Mailpit local está em http://127.0.0.1:54324; não envia mensagens aos provedores de e-mail externos.
6. `/entrar` permite login por e-mail/senha e oferece `/recuperar-senha`. Em ambiente local, o link de recuperação chega ao Mailpit em `http://127.0.0.1:54324`; a confirmação abre `/nova-senha`. Em `/conta`, cada pessoa vê seu perfil e o vínculo ativo. O fluxo genérico permite criar perfil, espaço e convite pelo aplicativo; um convite pendente expira em 30 dias. `/planejamento` permite que cada pessoa edite suas próprias estimativas mensais e leia as do casal. A UI de movimentações e desafio permanece fictícia; nenhum pagamento ou aporte real é escrito pelo onboarding ou pelo planejamento.
7. Inicie o conjunto leve de serviços necessários ao banco e Auth:

```bash
npx supabase start --exclude realtime,storage-api,imgproxy,postgres-meta,studio,edge-runtime,logflare,vector,supavisor
```

O endpoint local é `http://127.0.0.1:54321`; Postgres fica em `127.0.0.1:54322`. Pare sem apagar os dados com `npx supabase stop`.

8. Execute o teste SQL em instalação LOCAL descartável dentro do container Postgres:

```bash
docker exec -i supabase_db_nosso-futuro psql -U postgres -d postgres -v ON_ERROR_STOP=1 < supabase/tests/isolation.sql
docker exec -i supabase_db_nosso-futuro psql -U postgres -d postgres -v ON_ERROR_STOP=1 < supabase/tests/campaign_integrity.sql
```

O teste usa fixtures sintéticas e rollback. As migrações continuam bloqueando escritas de movimentações e aportes por clientes; o onboarding por RPC e a edição das próprias estimativas mensais foram liberados, mas comandos financeiros transacionais, assinatura Realtime e persistência da UI de movimentações ficam para as próximas etapas. Políticas e limites estão em [ARCHITECTURE](docs/ARCHITECTURE.md).

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

Resultados e limitações em [VALIDATION](docs/VALIDATION.md). A base PWA possui manifest, ícones e metadados; sem cache financeiro offline ou sincronização de operações.

## Planejamento

- [PRD: propósito, requisitos e regras](docs/PRD.md)
- [Arquitetura: estrutura, dados e acesso](docs/ARCHITECTURE.md)
- [Roadmap: sprints e decisões abertas](docs/ROADMAP.md)
- [Validação e limites da entrega](docs/VALIDATION.md)

## Licença

Licença de distribuição do produto ainda não definida; todos os direitos reservados. Mascotes e ícone foram desenhados para este projeto. Dependências mantêm suas licenças originais; Button segue o padrão de composição do shadcn/ui (MIT), sem assets de jogos de terceiros.
