# Arquitetura — fundação e Sprint 02 local

## Estado da fundação

Aplicação Next.js App Router, React e TypeScript strict. UI mobile-first em Tailwind 4, configuração shadcn/ui e Button local no padrão shadcn (Radix Slot, CVA, classes mescladas); nenhum pacote monolítico de componentes. Motion respeita movimento reduzido. Recharts permanece na demonstração anônima. Um projeto Supabase remoto de desenvolvimento em `sa-east-1` foi provisionado e vinculado pela CLI. Para uso diário, `.env.local` aponta ao stack Docker local rootless, mantido leve com Postgres, Auth, REST, Kong e Mailpit. Chaves e senha do banco ficam somente em arquivo local ignorado pelo Git. Sessões autenticadas com vínculo ativo já usam o banco local em início, finanças e desafio; o schema remoto também recebeu as migrações dessa fase em 27/10/2026, enquanto a aplicação e os dados pessoais continuam locais.

## Estrutura

```text
src/
  app/                  rotas, layouts, loading/error, manifest e autenticação
  components/           shell, dashboard, formulários, mascotes e provider demo
    ui/                 primitivas reutilizáveis
  domain/               finanças, permissões, campanha, recompensas puras
  lib/
    ai/                 contrato de interpretação; sem provedor
    demo/               fixtures explicitamente fictícias
    supabase/           configuração e clientes browser/servidor
  proxy.ts              renovação de sessão nas rotas de autenticação e financeiras
supabase/
  migrations/           tabelas, constraints, índices, RLS, auditoria e validação da campanha
  tests/                contrato SQL de isolamento para ambiente descartável
tests/                  unitários, componentes e Playwright
docs/                   requisitos, arquitetura, roadmap e validação
public/                 ícones originais PWA
```

## Fronteiras

Hoje há dois caminhos explícitos: visitantes sem sessão usam provider em memória e dados fictícios; pessoas autenticadas com vínculo ativo usam consultas RLS e RPCs transacionais no Supabase local. O provider de demonstração não é uma fronteira de segurança. A UI calcula apenas apresentações; saldo, permissão e idempotência são decididos no banco.

Destino: formulário manual ou proposta de IA confirmada → comando de aplicação → usuário verificado no servidor → validação do domínio → RPC transacional sob identidade do usuário → constraints/RLS/autorização → auditoria/outbox → regras de recompensa → atualização da interface por Realtime. Nunca confiar em owner_id, relationship_id, XP ou actor_id vindos do navegador.

## Modelo inicial de dados

| Tabela | Responsabilidade e relações |
| --- | --- |
| profiles | Identidade financeira mínima; PK vinculada a auth.users; nome e espécie selecionada individualmente em mascot |
| mascot_species | Catálogo extensível; chave estável cat/dog, nome de exibição e disponibilidade para seleção; referenciado por profiles.mascot |
| relationships | Tenant financeiro; múltiplos casais por instalação |
| relationship_members | N:N entre perfil e relacionamento; datas de entrada e revogação |
| relationship_invitations | Convite direcionado a uma conta Auth confirmada, com validade e registro de aceite/recusa |
| accounts | Conta individual (owner obrigatório) ou conjunta (owner nulo); BRL |
| account_opening_balances | Saldo observado e data de corte por conta, separado de receita |
| financial_entries | Receita, despesa ou transferência; contas de origem/destino do mesmo tenant, valor inteiro, idempotência, reversão |
| campaigns | Meta e regras JSON versionáveis; padrão para grade 1–200 |
| contributions | Reserva vinculada à campanha, participante e conta; slot e reversão |
| reward_events | XP/moedas virtuais separados, versão de regra e chave única por evento |
| audit_events | Ator autenticado, tabela, entidade, operação, antes/depois e instante |

O modelo de tabelas N:N preserva relacionamentos históricos; a operação atual permite um vínculo ativo por pessoa. As RPCs de onboarding exigem criação do espaço por uma pessoa e aceite explícito pela outra, com limite de duas pessoas ativas no espaço. Ter relacionamento em comum autoriza apenas linhas do contexto correspondente; não permite ler dados que o parceiro mantém em outro relacionamento.

Chaves estrangeiras compostas garantem que contas, participantes e campanhas pertencem ao mesmo relacionamento. Índice único parcial bloqueia slot duplicado ativo. Chave de idempotência é única por tenant. Registros financeiros têm limite de R$ 100 milhões por movimentação para manter compatibilidade entre bigint do PostgreSQL e inteiros seguros do JavaScript. Agregações futuras devem limitar resultado ou usar bigint/string na fronteira, sem converter bigint arbitrário para Number.

## Acesso: o que está ativo e o que falta

RLS habilitada em todas as tabelas; o teste PostgreSQL local cobre isolamento entre casais, parceiro, membro revogado e anônimo. Funções privadas SECURITY DEFINER, search_path vazio e execução restrita evitam recursão e vazamento. As políticas limitam leituras a tenants ativos; profiles é visível para si ou parceiros ativos. A RPC de mascote foi verificada com perfis sintéticos.

**INSERT/UPDATE/DELETE diretos nas tabelas financeiras continuam bloqueados para anon/authenticated.** As migrações `202610220004` a `202610220006` liberam somente RPCs específicas para criar conta, listar saldo, registrar/reverter movimentação, criar campanha, reservar/reverter número. Elas derivam o ator de `auth.uid()`, exigem vínculo ativo, restringem conta individual ao dono, serializam operações por conta, verificam saldo livre e mantêm idempotência por chave de requisição, inclusive na criação de conta com saldo inicial. A transferência toca as duas contas em uma transação. Tabelas de auditoria são somente leitura ao cliente; gatilhos capturam mutações de contas, saldos iniciais, lançamentos, contribuições e recompensas. Ações administrativas sem JWT têm actor_id nulo; uma camada operacional deverá registrar o operador e o motivo.

O incremento de seleção de mascote expõe uma operação específica para a preferência do próprio perfil, conforme a seção abaixo. Isso não libera atualização genérica de profiles nem qualquer escrita financeira, de inventário ou de recompensas pelo cliente.

O onboarding de perfis/casal está em `/conta`; `/financas` e `/desafios` autenticados usam as RPCs reais, enquanto visitantes veem uma demonstração identificada. Não usar service_role no navegador nem em variável NEXT_PUBLIC_. Segurança de aplicação e segurança SQL são complementares; testes PostgreSQL e de navegador sintéticos passaram no Supabase local. Saída/revogação do vínculo, retenção/exportação e operação publicada ainda precisam ser concluídas.

## Contabilidade e campanhas

A auditoria inicial de cálculos e lacunas está em [FINANCIAL_AUDIT.md](FINANCIAL_AUDIT.md). A migração `202610220001_campaign_integrity.sql` foi aplicada localmente e ao projeto remoto de desenvolvimento; as migrações de operações `004/005/006` estão somente no Supabase local. A grade valida regra, meta, número e valor e impede mudança após haver histórico.

- Receita: destino obrigatório; despesa: origem obrigatória; transferência: ambas diferentes, no mesmo tenant. Uma transferência gera um único evento com duas pontas na mesma transação e nunca entra nas somas de receitas/despesas.
- Saldo consolidado = saldos iniciais + receitas ativas − despesas ativas; transferências têm efeito consolidado zero.
- Saldo por conta = saldo inicial + receitas e transferências recebidas − despesas e transferências enviadas; reversões excluídas. O saldo inicial não é receita.
- Reserva de campanha fica em contributions e não gera receita. Saldo livre = saldo da conta − reservas ativas dessa conta. Aporte externo precisa primeiro de receita registrada uma única vez; aporte com mudança de conta precisa de transferência real e reserva na mesma unidade de trabalho.
- RPC de aporte bloqueia a conta para evitar sobre-reserva concorrente, verifica regra/valor e registra auditoria na mesma transação. Eventos de recompensa ainda não são emitidos.
- Correções mantêm histórico e reabrem slots revertidos. RPCs não permitirão alteração arbitrária de tenant, dono, valor ou contas em registros históricos.

## Gamificação independente

Motor puro em domain/rewards.ts é um esboço configurável com XP/moedas e deduplicação por chave. A persistência futura deve derivar a chave canônica no servidor e usar índice único/outbox para concorrência; chamar evaluateReward com UUIDs novos não constitui proteção por si só. Inventário, cosméticos, equipamentos, conquistas, missões individuais/conjuntas e cenários terão tabelas próprias quando forem implementados. Não criar modelos vazios e APIs fictícias para afirmar conclusão.

## Espécie selecionada e progressão independente — incremento da Sprint 01

### Modelo mínimo e evolução da migração

A migração `202610210001_foundation.sql` armazena a escolha em `profiles.mascot`, vinculada ao usuário. `202610210002_mascot_species.sql` adiciona o catálogo e a função restrita `select_mascot(text)`, preservando a coluna e valores atuais. Ambas foram aplicadas ao projeto Supabase de desenvolvimento. O lint do schema passou; um smoke test sintético confirmou escolha independente, espécie igual para dois perfis e rejeição de espécie desconhecida. Login de usuário e teste completo das políticas ainda não foram executados.

O arquivo incremental:

1. Criar `mascot_species` com código estável, nome de exibição e indicador de seleção; cadastrar gato e cachorro sem perfis fictícios.
2. Manter `profiles.mascot` para preservar a escolha existente e substituir o CHECK por FK, impedindo apagar espécies usadas. Não restringir unicidade; ambos podem usar a mesma espécie.
3. Expor somente leitura autenticada ao catálogo. Escrita do catálogo fica administrativa. Espécie desativada não pode ser escolhida, mas a escolha já salva e o renderer permanecem.
4. Expor `select_mascot(text)`, que deriva a identidade de `auth.uid()`, valida catálogo e altera somente a linha do perfil autenticado. Não conceder UPDATE geral em profiles.
5. Manter os defaults do onboarding como escolhas explícitas de Enzo/gato e Letícia/cachorro, nunca inferidos pelo nome. Preservar escolhas já gravadas.

Essa migração não altera contas, lançamentos, contribuições, reward_events ou suas permissões. A escrita de preferência de mascote é isolada em RPC; nenhuma escrita financeira é liberada.

### Identidade e invariantes de progressão

O personagem lógico pertence ao `user_id` estável. `mascot` é uma preferência de aparência; não é identificador do personagem nem chave de XP, nível, carteira virtual, conquistas ou inventário. O futuro agregado de progressão usará o usuário como identidade; eventos que já possuem contexto de relacionamento continuam nesse contexto ao trocar espécie. Nenhuma troca copia eventos entre relacionamentos ou recria sua origem canônica.

O motor de recompensas não recebe espécie como critério de saldo/progressão. A seleção não produz XP/moedas e não apaga ou reprocessa histórico. Novas espécies exigem catálogo, assets/renderer e compatibilidades de itens, sem refatoração das regras de progressão.

Ao implementar itens: `inventory` representa a propriedade estável por usuário; `equipment` representa o que está equipado por usuário/slot. Um catálogo de compatibilidade relacionará itens e espécies; itens universais devem ter uma regra explícita, sem listas deduzidas na UI. Item incompatível permanece no inventário e aparece como indisponível para equipar na espécie atual. Não usar exclusão em cascata da seleção para inventário, conquistas ou progressão.

### Operação de seleção

Contrato planejado: `selectMascot(speciesId)` altera apenas o perfil autenticado e, quando existir equipamento, as referências de equipamento incompatíveis. Requisições para uma espécie inexistente ou indisponível falham sem modificar a preferência anterior. Selecionar a espécie já ativa é uma operação sem efeito e sem recompensa.

A operação deve bloquear o perfil e compartilhar o mesmo protocolo de bloqueio com equipar/desequipar; validar propriedade e compatibilidade no servidor/banco. Quando houver equipamentos, a mudança de espécie e o desequipamento dos incompatíveis acontecem na mesma transação. Uma falha desfaz ambas. Slots compatíveis permanecem, itens continuam no inventário e voltar à espécie anterior não os reequipa automaticamente. Nesta sprint não criar tabelas vazias de inventário para simular esse comportamento.

### Consistência de apresentação

Definir uma fonte única de perfis selecionados na camada de dados; componentes recebem usuário, nome e código da espécie. Dashboard, desafios, perfil e áreas do RPG não mantêm mapas próprios do tipo Enzo → gato ou Letícia → cachorro. Resolver a espécie em um registro de renderers por código; não usar o ramo `else` de gato como sinônimo de qualquer espécie futura. Espécie desconhecida ou renderer indisponível exibe estado neutro identificável, sem substituir silenciosamente pelo cachorro.

A descrição acessível combina espécie e proprietário independentemente: um gato pode pertencer a Letícia e ambos podem usar cachorro. O componente atual `Mascot` e suas chamadas ainda têm associações fixas; sua adaptação será parte do incremento, mantendo o desenho original e os demais fluxos concluídos.

Após confirmação da escrita, atualizar/invalidate a consulta de perfis compartilhada; todas as áreas usam o mesmo estado. Outras sessões e o parceiro autorizado recebem atualização por assinatura restrita ao perfil ou refetch no retorno/foco, a validar na integração. Não adicionar profiles inteiro à publicação Realtime sem revisar os dados expostos e a RLS. Erro conserva o estado confirmado; durante envio, indicar carregamento e impedir submissões conflitantes. Recarregar deve consultar o banco, não restaurar defaults ou depender de localStorage.

### Validação exigida antes de concluir

Testar ambas as espécies para cada usuário, duas pessoas com a mesma espécie, persistência após nova sessão, tentativa de alterar terceiro, catálogo inválido/inativo e erro de gravação. Na UI, verificar todas as áreas e nomes acessíveis após a troca. Quando existir progressão/inventário, comparar estado antes/depois de trocas repetidas, verificar propriedade preservada e desequipamento atômico sob concorrência. Até lá, manter os testes de regressão financeiros e registrar explicitamente que as garantias sobre esses sistemas futuros são contratos arquiteturais, não funcionalidades já testadas.

## Autenticação e Realtime

Clientes @supabase/ssr separados, cookies renovados pelo proxy e getUser no servidor protegem as rotas reais. Login e recuperação de senha pelo Mailpit local foram validados pelo casal; cadastro público continua desativado. O provedor de e-mail fica ativo para permitir login/recuperação de contas existentes, enquanto `[auth].enable_signup=false` impede cadastro público. `/auth/confirm` exige clique explícito e mantém o mesmo host. A migração `202610220002_onboarding.sql` expõe RPCs de perfil, espaço, convite e aceite/recusa pela própria conta, com limite de um vínculo ativo por pessoa e duas pessoas por espaço. Os dois perfis são membros ativos do espaço local; RLS permite leitura mútua após o aceite. A tabela de convites não tem leitura direta. As migrações financeiras `004/005/006` expõem operações autorizadas somente no ambiente local; escrita direta nas tabelas segue bloqueada. Saída/revogação, retenção/exportação e renovação de sessão ainda não foram concluídas. Respostas de autenticação são privadas, sem cache público. A migração inicial adiciona financial_entries/contributions à publicação supabase_realtime; assinaturas da UI e reconexão ficam para depois. O serviço Realtime não é iniciado no stack local leve. Nunca usar Realtime como fonte de autorização.

## PWA, acessibilidade e interface

Manifest, ícones PNG 192/512, tema, standalone e metadados Apple. Base para instalação; sem service worker, cache financeiro ou operações offline nesta sprint. Instalação em dispositivos/HTTPS ainda precisa ser validada. Escritas offline exigirão fila idempotente, reconciliação e política explícita de dados sensíveis.

Tokens verdes/areia, tipos locais sem download de fontes, foco visível, skip-link, labels, alvos de 44px, gráficos acompanhados de totais em texto, navegação fixa mobile com safe area. Mascotes SVG originais desenhados no código. Escopo atual cobre layout responsivo, não uma biblioteca completa com todos os estados de cada componente.

## Versões e referências

Registro npm consultado em 21/10/2026 antes da instalação: Node local 24.21.0; Next 16.4.2 (Node >=20.9), React 19.3.1, Tailwind 4.3.3, Supabase SSR 0.12.7 (supabase-js >=2.114), Motion 14.5.0, Recharts 3.10.1, Vitest 5.0.5 (Node 24 aceito), Playwright 1.64.1. Versões efetivas ficam no package-lock.json; instalação reproduzível via npm ci.

- [Next.js: instalação](https://nextjs.org/docs/app/getting-started/installation)
- [Supabase: clientes SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs)
- [shadcn/ui: instalação manual](https://ui.shadcn.com/docs/installation/manual)
- [Next.js: PWA](https://nextjs.org/docs/app/guides/progressive-web-apps)


## Revisão de consultas e tipos — 27/10/2026

Clientes browser/servidor/proxy usam os tipos gerados. `types.ts` corrige somente a nulabilidade dos argumentos de origem/destino da RPC de lançamento, conforme o contrato SQL; o arquivo gerado fica intacto. Alguns tipos de apresentação ainda restringem strings do banco conforme seus CHECKs.

`finance/queries.ts` lê lançamentos e reservas em páginas, com desempate por ID, para não usar somente os primeiros 200/300 registros nos totais e na grade. Erros descartam resultados parciais; sobreposição de IDs durante leitura também falha, evitando duplicação. Filtros de período/conta/tipo são locais após leitura autorizada por RLS. Reversões permanecem visíveis; receitas/despesas excluem reversões e transferências; saldo livre e meta não dependem do mês selecionado.

Limite: várias requisições não constituem snapshot transacional, e o custo cresce com o histórico. Para históricos grandes e consistência de relatórios sob alterações simultâneas, evoluir para agregações SQL e paginação de histórico no servidor. A autorização e a validação de cada escrita permanecem transacionais no banco.


## Preparação de publicação — 27/10/2026

O build padrão usa Webpack; `build:deploy` ativa saída standalone Node. O start aceita conexões em `0.0.0.0` e a porta da plataforma. `build:deploy` exige URL Supabase hospedada, chave pública e `APP_URL` HTTPS; registra a identidade do build e um hash da chave pública. `deploy:package` confere essa identidade, copia runtime/assets para uma pasta única em `.deploy/` e exclui arquivos `.env*`, Git e contexto privado. Não usar o build local diretamente no ambiente online: variáveis `NEXT_PUBLIC_*` são fixadas durante o build.

A recuperação suporta o template próprio com `token_hash` e o callback PKCE `/auth/callback?next=/nova-senha`. O callback aceita somente destinos internos predeterminados, usa `APP_URL` quando configurada e retorna respostas sem cache. O template de convite próprio está em `supabase/templates/invite.html`; ambos os templates devem ser configurados no Auth remoto. SMTP externo continua necessário para convite e recuperação por e-mail de ambos os participantes.

Ver procedimento de publicação no README. Preparação de código não reativa projeto pausado, não aplica migrações, não transfere usuários/dados e não cria infraestrutura automaticamente.


### Estado remoto confirmado após reativação — 27/10/2026

Projeto remoto reativado pelo usuário, estado ACTIVE_HEALTHY. As cinco migrações pendentes de onboarding, planejamento e operações financeiras foram aplicadas após dry-run e cópia do schema anterior; histórico remoto agora coincide com as oito migrações locais. Lint SQL remoto sem erros. Nenhum dado financeiro ou usuário local foi importado. Leitura anônima de accounts, financial_entries, monthly_plan_items e contributions negada pelo REST com HTTP 401/código PostgreSQL 42501.

Auth health/settings retornam 200. Cadastro público continua desativado, mas o provedor de e-mail remoto está desativado (`external.email=false`); precisa ser habilitado antes de login por senha, preservando o bloqueio de cadastro público. URLs públicas, SMTP e templates dependem da preparação do ambiente final. `.env.local` segue apontando ao banco local.


## Primeira publicação Vercel Hobby — 27/10/2026

Projeto `organiza-ai`, domínio de produção `https://organiza-ai-rust.vercel.app`, Node 24, build Webpack e funções na região `gru1` junto ao banco de São Paulo. Variáveis de produção e preview: URL/chave pública do Supabase remoto, APP_URL e APP_PRIVATE=true. Nenhuma chave administrativa foi enviada. O proxy privado exige sessão nas áreas do casal, mantém os caminhos de autenticação públicos e retorna 503 se a configuração estiver ausente. Páginas continuam verificando usuário no servidor e o banco aplica RLS/autorização das RPCs. A demonstração local continua disponível com APP_PRIVATE ausente.

`.vercelignore` exclui dados/configuração local do Supabase, contexto privado, ambientes e resultados de testes. O padrão de exclusão da pasta Supabase é ancorado na raiz para preservar `src/lib/supabase`. Manifesto dry-run conferiu 73 arquivos e a presença dos clientes/tipos. `.vercel` está ignorado no Git; o vínculo da CLI acrescentou VERCEL_OIDC_TOKEN ao `.env.local`, que permanece privado e não é enviado.

Auth remoto: provedor e-mail habilitado, cadastro público bloqueado, Site URL e allowlist configurados para a produção. Credencial da sessão da CLI reutilizada em memória pela API oficial de Management; nenhuma credencial foi impressa ou gravada em código. SMTP personalizado ainda ausente; as duas contas e o planejamento não foram migrados sem a escolha do usuário. Login remoto das pessoas não foi declarado validado.

## Estado atualizado — 30/10/2026

A migração autorizada das duas identidades e dados locais foi concluída: perfis, espaço/membros, 18 estimativas, conta e saldo inicial, com UUIDs e hashes de senha preservados. Nenhuma sessão local foi copiada. O schema remoto inclui as operações financeiras e a nova migração `202610300001_mascot_wardrobe.sql`. A seleção de espécie deixou de ser apenas planejada: UI persistente em `/mascotes`, aparência compartilhada com o dashboard e rótulos independentes de espécie/dono. A economia cosmética efetiva e seus limites estão em [MASCOTS.md](MASCOTS.md); as seções históricas acima descrevem etapas anteriores.
