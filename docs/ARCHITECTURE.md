# Arquitetura — Sprint 01

## Estado da fundação

Aplicação Next.js App Router, React e TypeScript strict. UI mobile-first em Tailwind 4, configuração shadcn/ui e Button local no padrão shadcn (Radix Slot, CVA, classes mescladas); nenhum pacote monolítico de componentes. Motion respeita movimento reduzido. Recharts apresenta valores fictícios. Um projeto Supabase remoto de desenvolvimento em `sa-east-1` foi provisionado e vinculado pela CLI. Para uso diário, `.env.local` aponta ao stack Docker local rootless, mantido leve com Postgres, Auth, REST, Kong e Mailpit. Chaves e senha do banco ficam somente em arquivo local ignorado pelo Git. Nenhum desses bancos alimenta as telas financeiras ainda.

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
  proxy.ts              renovação de sessão nas rotas de autenticação
supabase/
  migrations/           tabelas, constraints, índices, RLS, auditoria e validação da campanha
  tests/                contrato SQL de isolamento para ambiente descartável
tests/                  unitários, componentes e Playwright
docs/                   requisitos, arquitetura, roadmap e validação
public/                 ícones originais PWA
```

## Fronteiras

Hoje: componentes → provider em memória → funções de domínio. Nenhum fluxo financeiro da interface escreve no Supabase, inclusive após autenticar. O provider não é uma fronteira de segurança: é uma simulação para UX e testes.

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
| financial_entries | Receita, despesa ou transferência; contas de origem/destino do mesmo tenant, valor inteiro, idempotência, reversão |
| campaigns | Meta e regras JSON versionáveis; padrão para grade 1–200 |
| contributions | Reserva vinculada à campanha, participante e conta; slot e reversão |
| reward_events | XP/moedas virtuais separados, versão de regra e chave única por evento |
| audit_events | Ator autenticado, tabela, entidade, operação, antes/depois e instante |

O modelo de tabelas N:N preserva relacionamentos históricos; a operação atual permite um vínculo ativo por pessoa. As RPCs de onboarding exigem criação do espaço por uma pessoa e aceite explícito pela outra, com limite de duas pessoas ativas no espaço. Ter relacionamento em comum autoriza apenas linhas do contexto correspondente; não permite ler dados que o parceiro mantém em outro relacionamento.

Chaves estrangeiras compostas garantem que contas, participantes e campanhas pertencem ao mesmo relacionamento. Índice único parcial bloqueia slot duplicado ativo. Chave de idempotência é única por tenant. Registros financeiros têm limite de R$ 100 milhões por movimentação para manter compatibilidade entre bigint do PostgreSQL e inteiros seguros do JavaScript. Agregações futuras devem limitar resultado ou usar bigint/string na fronteira, sem converter bigint arbitrário para Number.

## Acesso: o que está ativo e o que falta

RLS habilitada em todas as tabelas; a consulta ao banco de desenvolvimento confirmou RLS nas dez tabelas iniciais e ausência de UPDATE direto por authenticated. Funções privadas SECURITY DEFINER, search_path vazio e execução restrita evitam recursão e vazamento. As políticas limitam leituras a tenants ativos; profiles é visível para si ou parceiros ativos. A RPC de mascote foi verificada com perfis sintéticos. O teste dinâmico completo de isolamento ainda está pendente.

**Todas as escritas financeiras de anon/authenticated continuam bloqueadas.** A migração de onboarding expõe apenas RPCs delimitadas para perfil e vínculo, sem conceder escrita direta nas tabelas. A autorização individual/conjunta da interface financeira segue apenas na demonstração; ainda não é um fluxo real de persistência. Futuras RPCs financeiras devem validar membership ativo, dono de registro individual, escopo das duas contas de uma transferência, responsável e vínculo de contribuição. Tabelas de auditoria são somente leitura ao cliente; gatilhos capturam mutações de lançamentos, contribuições e recompensas. A identidade do ator é auth.uid(), não um campo fornecido pelo cliente. Ações administrativas sem JWT têm actor_id nulo; uma camada operacional deverá registrar o operador e o motivo.

O incremento de seleção de mascote expõe uma operação específica para a preferência do próprio perfil, conforme a seção abaixo. Isso não libera atualização genérica de profiles nem qualquer escrita financeira, de inventário ou de recompensas pelo cliente.

O onboarding de perfis/casal está em `/conta`; a edição de dados financeiros reais continua fora da UI. Não usar service_role no navegador nem em variável NEXT_PUBLIC_. Segurança de aplicação e segurança SQL são complementares; os testes puros não provam RLS. Testes SQL devem passar em Supabase descartável antes de qualquer uso com dinheiro real.

## Contabilidade e campanhas

A auditoria detalhada de cálculos, persistência e lacunas para dinheiro real está em [FINANCIAL_AUDIT.md](FINANCIAL_AUDIT.md). A migração `202610220001_campaign_integrity.sql` foi aplicada localmente e ao projeto remoto de desenvolvimento: valida regra de grade, meta, número e valor de aportes, e impede alteração das regras após haver histórico. Ainda não há RPC financeira ou vínculo entre a UI e essas tabelas.

- Receita: destino obrigatório; despesa: origem obrigatória; transferência: ambas diferentes, no mesmo tenant. Uma transferência gera um único evento com duas pontas na mesma transação e nunca entra nas somas de receitas/despesas.
- Saldo consolidado = receitas ativas − despesas ativas, incluindo saldos iniciais que terão estratégia de migração definida na Sprint 02.
- Saldo por conta futura: receitas e transferências recebidas − despesas e transferências enviadas; reversões excluídas.
- Reserva de campanha fica em contributions e não gera receita. Saldo livre = saldo da conta − reservas ativas dessa conta. Aporte externo precisa primeiro de receita registrada uma única vez; aporte com mudança de conta precisa de transferência real e reserva na mesma unidade de trabalho.
- RPC de aporte deverá bloquear a conta para evitar sobre-reserva concorrente, verificar número/valor segundo rules e incluir auditoria/evento de domínio atomicamente. Isso ainda não está implementado.
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

Clientes @supabase/ssr separados, cookies renovados pelo proxy e getUser no servidor para proteger /conta. Login por e-mail/senha está preparado; cadastro público está desativado local e remotamente. Enzo e Letícia autenticaram no Auth local. `/auth/confirm` exige clique antes de verificar o link no navegador e mantém a sessão no mesmo host. `/convite` permite definir senha. A migração `202610220002_onboarding.sql` libera apenas RPCs de perfil, espaço e convite: identidade derivada de `auth.uid()`, alvo do convite por e-mail confirmado, aceite/recusa pela conta destinatária, validade de 30 dias e limite de um relacionamento ativo por pessoa e duas pessoas por espaço nas operações expostas. A tabela de convites não tem leitura direta pelo cliente; a RPC lista somente convites próprios. Perfis Enzo/gato e Letícia/cachorro foram provisionados somente no banco local; o espaço “Nosso Futuro” tem Enzo como membro e convite pendente para Letícia, ainda sem consentimento dela para o vínculo. A leitura RLS antes do aceite mostra apenas o próprio perfil a cada pessoa; Letícia não vê o espaço ou membros até aceitar. Escritas financeiras permanecem bloqueadas. Saída/revogação, retenção/exportação e recuperação de acesso por e-mail seguem pendentes. Respostas de autenticação são privadas, sem cache público. A migração inicial adiciona financial_entries/contributions à publicação supabase_realtime; assinaturas da UI e tratamento de reconexão ficam para a etapa de persistência. O serviço Realtime não é iniciado no stack local leve nesta sprint. Nunca usar Realtime como fonte de autorização.

## PWA, acessibilidade e interface

Manifest, ícones PNG 192/512, tema, standalone e metadados Apple. Base para instalação; sem service worker, cache financeiro ou operações offline nesta sprint. Instalação em dispositivos/HTTPS ainda precisa ser validada. Escritas offline exigirão fila idempotente, reconciliação e política explícita de dados sensíveis.

Tokens verdes/areia, tipos locais sem download de fontes, foco visível, skip-link, labels, alvos de 44px, gráficos acompanhados de totais em texto, navegação fixa mobile com safe area. Mascotes SVG originais desenhados no código. Escopo atual cobre layout responsivo, não uma biblioteca completa com todos os estados de cada componente.

## Versões e referências

Registro npm consultado em 21/10/2026 antes da instalação: Node local 24.21.0; Next 16.4.2 (Node >=20.9), React 19.3.1, Tailwind 4.3.3, Supabase SSR 0.12.7 (supabase-js >=2.114), Motion 14.5.0, Recharts 3.10.1, Vitest 5.0.5 (Node 24 aceito), Playwright 1.64.1. Versões efetivas ficam no package-lock.json; instalação reproduzível via npm ci.

- [Next.js: instalação](https://nextjs.org/docs/app/getting-started/installation)
- [Supabase: clientes SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs)
- [shadcn/ui: instalação manual](https://ui.shadcn.com/docs/installation/manual)
- [Next.js: PWA](https://nextjs.org/docs/app/guides/progressive-web-apps)
