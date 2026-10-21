# Arquitetura — Sprint 01

## Estado da fundação

Aplicação Next.js App Router, React e TypeScript strict. UI mobile-first em Tailwind 4, configuração shadcn/ui e Button local no padrão shadcn (Radix Slot, CVA, classes mescladas); nenhum pacote monolítico de componentes. Motion respeita movimento reduzido. Recharts apresenta valores fictícios. Supabase fornece os clientes de Auth e o destino da migração SQL; não há banco externo configurado automaticamente.

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
  migrations/           tabelas, constraints, índices, RLS e auditoria
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
| profiles | Identidade financeira mínima; PK vinculada a auth.users; nome e tipo de mascote |
| relationships | Tenant financeiro; múltiplos casais por instalação |
| relationship_members | N:N entre perfil e relacionamento; datas de entrada e revogação |
| accounts | Conta individual (owner obrigatório) ou conjunta (owner nulo); BRL |
| financial_entries | Receita, despesa ou transferência; contas de origem/destino do mesmo tenant, valor inteiro, idempotência, reversão |
| campaigns | Meta e regras JSON versionáveis; padrão para grade 1–200 |
| contributions | Reserva vinculada à campanha, participante e conta; slot e reversão |
| reward_events | XP/moedas virtuais separados, versão de regra e chave única por evento |
| audit_events | Ator autenticado, tabela, entidade, operação, antes/depois e instante |

Modelo N:N permite manter relacionamentos históricos ou contextos futuros, sem pressupor uma única linha global para o casal. Limite de dois membros ativos, convites, consentimento e capacidade de participação simultânea precisam de RPCs próprias antes de onboarding real; nesta sprint nenhuma associação pode ser criada pelo cliente. Ter relacionamento em comum autoriza apenas linhas do contexto correspondente; não permite ler dados que o parceiro mantém em outro relacionamento.

Chaves estrangeiras compostas garantem que contas, participantes e campanhas pertencem ao mesmo relacionamento. Índice único parcial bloqueia slot duplicado ativo. Chave de idempotência é única por tenant. Registros financeiros têm limite de R$ 100 milhões por movimentação para manter compatibilidade entre bigint do PostgreSQL e inteiros seguros do JavaScript. Agregações futuras devem limitar resultado ou usar bigint/string na fronteira, sem converter bigint arbitrário para Number.

## Acesso: o que está ativo e o que falta

RLS habilitada em todas as tabelas. Funções privadas SECURITY DEFINER, search_path vazio e execução restrita evitam recursão e vazamento. Autenticados podem ler apenas tenants ativos; profiles é visível para si ou parceiros ativos. Anônimos não têm grants. Membros revogados não passam por is_member. Cliente não pode escrever membros, auditoria ou recompensas.

**A migração desta sprint bloqueia todas as escritas de negócio de anon/authenticated.** É uma base deliberadamente fechada: não liberar políticas de escrita genéricas antes de construir RPCs transacionais. A autorização individual/conjunta está implementada e testada no domínio da demonstração; ainda não é um fluxo real de persistência. Futuras RPCs devem validar membership ativo, dono de registro individual, escopo das duas contas de uma transferência, responsável e vínculo de contribuição. Tabelas de auditoria são somente leitura ao cliente; gatilhos capturam mutações de lançamentos, contribuições e recompensas. A identidade do ator é auth.uid(), não um campo fornecido pelo cliente. Ações administrativas sem JWT têm actor_id nulo; uma camada operacional deverá registrar o operador e o motivo.

O bootstrap de perfis/casais e a edição de dados reais estão fora da UI. Não usar service_role no navegador nem em variável NEXT_PUBLIC_. Segurança de aplicação e segurança SQL são complementares; os testes puros não provam RLS. Testes SQL devem passar em Supabase descartável antes de qualquer uso com dinheiro real.

## Contabilidade e campanhas

- Receita: destino obrigatório; despesa: origem obrigatória; transferência: ambas diferentes, no mesmo tenant. Uma transferência gera um único evento com duas pontas na mesma transação e nunca entra nas somas de receitas/despesas.
- Saldo consolidado = receitas ativas − despesas ativas, incluindo saldos iniciais que terão estratégia de migração definida na Sprint 02.
- Saldo por conta futura: receitas e transferências recebidas − despesas e transferências enviadas; reversões excluídas.
- Reserva de campanha fica em contributions e não gera receita. Saldo livre = saldo da conta − reservas ativas dessa conta. Aporte externo precisa primeiro de receita registrada uma única vez; aporte com mudança de conta precisa de transferência real e reserva na mesma unidade de trabalho.
- RPC de aporte deverá bloquear a conta para evitar sobre-reserva concorrente, verificar número/valor segundo rules e incluir auditoria/evento de domínio atomicamente. Isso ainda não está implementado.
- Correções mantêm histórico e reabrem slots revertidos. RPCs não permitirão alteração arbitrária de tenant, dono, valor ou contas em registros históricos.

## Gamificação independente

Motor puro em domain/rewards.ts é um esboço configurável com XP/moedas e deduplicação por chave. A persistência futura deve derivar a chave canônica no servidor e usar índice único/outbox para concorrência; chamar evaluateReward com UUIDs novos não constitui proteção por si só. Inventário, cosméticos, equipamentos, conquistas, missões individuais/conjuntas e cenários terão tabelas próprias quando forem implementados. Não criar modelos vazios e APIs fictícias para afirmar conclusão.

## Autenticação e Realtime

Clientes @supabase/ssr separados, cookies renovados pelo proxy e getUser no servidor para proteger /conta. Login por e-mail/senha e saída preparados; nenhuma conta criada implicitamente. Respostas de autenticação são privadas, sem cache público. Cadastro, convite, confirmação e recuperação são próximos passos. Migração adiciona financial_entries/contributions à publicação supabase_realtime; assinaturas da UI e tratamento de reconexão ficam para a etapa de persistência. Nunca usar Realtime como fonte de autorização.

## PWA, acessibilidade e interface

Manifest, ícones PNG 192/512, tema, standalone e metadados Apple. Base para instalação; sem service worker, cache financeiro ou operações offline nesta sprint. Instalação em dispositivos/HTTPS ainda precisa ser validada. Escritas offline exigirão fila idempotente, reconciliação e política explícita de dados sensíveis.

Tokens verdes/areia, tipos locais sem download de fontes, foco visível, skip-link, labels, alvos de 44px, gráficos acompanhados de totais em texto, navegação fixa mobile com safe area. Mascotes SVG originais desenhados no código. Escopo atual cobre layout responsivo, não uma biblioteca completa com todos os estados de cada componente.

## Versões e referências

Registro npm consultado em 21/10/2026 antes da instalação: Node local 24.21.0; Next 16.4.2 (Node >=20.9), React 19.3.1, Tailwind 4.3.3, Supabase SSR 0.12.7 (supabase-js >=2.114), Motion 14.5.0, Recharts 3.10.1, Vitest 5.0.5 (Node 24 aceito), Playwright 1.64.1. Versões efetivas ficam no package-lock.json; instalação reproduzível via npm ci.

- [Next.js: instalação](https://nextjs.org/docs/app/getting-started/installation)
- [Supabase: clientes SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs)
- [shadcn/ui: instalação manual](https://ui.shadcn.com/docs/installation/manual)
- [Next.js: PWA](https://nextjs.org/docs/app/guides/progressive-web-apps)
