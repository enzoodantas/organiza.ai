# Nosso Futuro

Fundação de uma plataforma de finanças pessoais e compartilhadas para casais, originalmente chamada **organiza.ai**. Nosso norte é ajudar na vida financeira e preparar o casamento. Mascotes e gamificação apoiarão hábitos saudáveis.

**Sprint 01: demonstração funcional em memória + preparação da infraestrutura.** Não usar para registrar dinheiro real. Dados iniciais são fictícios, alterações não persistem após recarregar e autenticar não transforma a demonstração em produto real.

## Executar localmente

Requer Node.js 24 LTS e npm. Ambiente inicial: Node 24.21.0 e npm 11.19.0.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Abrir http://127.0.0.1:3000. Variáveis podem permanecer vazias para explorar a demonstração. Não é necessário contratar serviço ou fornecer credenciais para esse modo. Para produção local: `npm run build` e `npm start`.

## O que experimentar

- Início: resumo consolidado, gráfico e progresso do desafio fictícios.
- Finanças: filtrar por participante/espaço conjunto, adicionar receita/despesa e reverter registros autorizados.
- Desafios: preencher número de 1 a 200, ver responsável/progresso e reverter aporte. Duplicidades ativas são bloqueadas.
- Perfil: alternar participante fictício e observar a restrição de edição individual.
- Mascotes: prévia original do gato e cachorrinho, com evolução explicitamente futura.

O botão Registrar fica acessível no celular. Voz, itens, XP, moedas, missões e personalização não estão ativos.

## Supabase de desenvolvimento

1. Criar um projeto de desenvolvimento ou usar a CLI Supabase com Docker (`supabase init` e `supabase start`; configuração local não fornecida nesta sprint).
2. Copiar a Project URL e a **publishable key** para `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` em `.env.local`.
3. Não utilizar `service_role`, secret key, senha PostgreSQL ou chave de IA nessas variáveis. `.env.local` é ignorado pelo Git.
4. Aplicar `supabase/migrations/202610210001_foundation.sql` via SQL Editor do projeto de desenvolvimento ou `supabase db reset` no ambiente local. Não aplicar primeiro em produção.
5. Criar manualmente duas contas de teste no Auth do Supabase. Não há cadastro/onboarding pela interface nesta sprint. Não inserir dados reais.
6. Reiniciar Next.js. Abrir `/entrar` para login por e-mail/senha. `/conta` valida o usuário no servidor e permite sair. A UI financeira permanece fictícia.
7. Executar o teste SQL em instalação LOCAL descartável com `psql` e a conexão local retornada pela CLI:

```bash
psql "$SUPABASE_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/isolation.sql
```

Definir `SUPABASE_TEST_DATABASE_URL` apenas no shell local, sem versionar a senha. O teste usa fixtures sintéticas e rollback. A migração bloqueia escritas de negócio para clientes; onboarding, comandos transacionais, assinatura Realtime e persistência da UI ficam para a Sprint 02. Políticas e limites estão em [ARCHITECTURE](docs/ARCHITECTURE.md).

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
