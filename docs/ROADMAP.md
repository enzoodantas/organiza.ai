# Planejamento e roadmap — Nosso Futuro

## Norte permanente

**Nos ajudar na vida financeira individual e a dois, começando pela organização do dinheiro e pela poupança para o casamento.** Priorizar uso simples, números confiáveis e decisões compartilhadas. Consultar PRD.md antes de ampliar o escopo. Gamificação apoia os hábitos; não pode atrasar a utilidade financeira básica.

## Sprint 01 — Fundação

### Incremento de requisito — escolha de espécie do mascote

Incorporado à Sprint 01 sem reiniciar o projeto. A seleção simples deve ser individual, persistente e independente da progressão. Enzo começa com gato e Letícia com cachorro; ambos podem trocar e usar a mesma espécie. Regras completas e aceite em [PRD.md](PRD.md); modelo, migração incremental e operação em [ARCHITECTURE.md](ARCHITECTURE.md).

- [x] Documentar escolhas iniciais alteráveis, espécies iguais permitidas e preferência vinculada ao usuário.
- [x] Definir catálogo extensível e separação entre espécie, identidade, progressão, inventário e equipamentos.
- [x] Preparar migração incremental `202610210002_mascot_species.sql` com catálogo `cat`/`dog`, FK preservando `profiles.mascot` e RPC que só seleciona a espécie do usuário autenticado.
- [x] Aplicar `202610210001_foundation.sql` e `202610210002_mascot_species.sql` no projeto Supabase de desenvolvimento; validar lint, RLS/grants e smoke test da RPC com usuários sintéticos.
- [ ] Completar o teste SQL de isolamento para parceiro, outro casal, membro revogado, anônimo e tentativas de escrita; a suíte atual está restrita a Supabase local descartável.
- [ ] Adicionar seletor simples entre gato e cachorro, com carregamento, erro e confirmação após persistência.
- [ ] Centralizar leitura da seleção e adaptar mascotes/descrições acessíveis em dashboard, desafios, perfil e demais áreas do RPG, eliminando associações fixas por participante.
- [ ] Validar persistência entre sessões, espécies iguais, isolamento de usuários e regressão dos fluxos concluídos.
- [ ] Quando progressão/equipamentos existirem, comprovar que a troca preserva XP, nível, moedas, conquistas e propriedade dos itens; apenas desequipa os incompatíveis na mesma transação.

Estado: banco de desenvolvimento configurado pela CLI; catálogo e RPC aplicados e smoke-tested. Seleção na aplicação ainda pendente. A entrega continua funcionando em demonstração com as escolhas iniciais. Este incremento não inclui editor complexo, novas espécies visuais ou implementação antecipada do inventário. Implementar o seletor simples sem iniciar os demais sistemas de RPG.

### Registro de entrega e ponto de retomada — 21/10/2026

A fundação foi implementada e validada localmente. O usuário solicitou registrar as pendências e enviar a entrega para `main`, deixando a revisão visual para depois. O envio do código não representa publicação do aplicativo nem ativação de dados reais.

Estado entregue: cinco áreas responsivas, mascotes originais, movimentações e desafio em demonstração, documentação, base de autenticação e migração de dados. TypeScript, lint, build, 31 testes unitários/de componentes e 10 testes de navegador passaram. Evidências e limites estão em [VALIDATION.md](VALIDATION.md).

**Retomar pelo Supabase de desenvolvimento e pelo primeiro fluxo financeiro persistente.** Não iniciar inventário, animações adicionais ou IA antes de tornar o registro financeiro confiável e útil para o casal.

Pendências, em ordem de execução:

- [ ] Revisar a demonstração com o casal quando houver disponibilidade; confirmar se a navegação e os resumos ajudam a entender e organizar o dinheiro.
- [x] Criar organização e projeto Supabase de desenvolvimento via CLI; vincular o repositório e configurar URL/publishable key apenas em `.env.local` local.
- [x] Aplicar as duas migrations via `supabase db push`; histórico remoto conferido e `db lint --linked` sem erros.
- [x] Instalar Docker rootless, subir Supabase local enxuto e validar migrations/lint e isolamento SQL com rollback.
- [x] Desativar cadastro público e alinhar URLs de retorno local nas configurações Auth locais/remotas.
- [x] Criar convites locais somente para Enzo e Letícia; ambas as contas foram autenticadas e os perfis provisionados localmente.
- [ ] Concluir aceite de Letícia em `/conta`, validar renovação de sessão e saída de ambas; recuperação de acesso por e-mail ainda pendente.
- [x] Implementar convite de vínculo e aceite/recusa pela própria conta, com limite de dois participantes ativos nas operações expostas.
- [ ] Definir e implementar saída/revogação de vínculo, retenção e exportação do histórico.
- [ ] Implementar RPCs transacionais para contas, receitas/despesas, transferências, reservas e reversões, com autorização no servidor/banco e auditoria.
- [ ] Após as RPCs e onboarding, importar de forma revisável os lançamentos do último mês a partir do extrato fornecido pelo casal; confirmar categorias, contas, duplicidades e totais antes de gravar.
- [ ] Validar saldo livre por conta, centavos, escopos, idempotência e concorrência. Manter as escritas reais bloqueadas até essas verificações passarem.
- [ ] Conectar a interface a dados persistidos, gerar tipos do banco e testar dois casais isolados, sem fallback silencioso para demonstração.
- [ ] Ligar e validar as assinaturas Realtime após o fluxo persistente estar seguro.
- [ ] Acompanhar a correção dos cinco alertas da cadeia de desenvolvimento do lint e a compatibilidade para atualizar ESLint. Auditoria de produção desta entrega: zero alertas.
- [ ] Validar instalação PWA em celular físico; offline e sincronização ainda não estão implementados.
- [ ] Evoluir recompensas, inventário, missões e cenário somente após validar a utilidade financeira básica. Voz/IA continuam futuras e sem API paga integrada.

Decisões a confirmar no momento adequado: nome final do produto, contas e saldos iniciais, orçamento/data do casamento e política de retenção/exportação após saída do relacionamento. Não presumir essas informações na implementação.

Ordem de implementação acordada:

1. Inspecionar ambiente e repositório; conferir versões e compatibilidade.
2. Documentar produto, arquitetura, modelo de dados, acesso e limites.
3. Configurar Next.js/TypeScript, Tailwind/shadcn e integrações mínimas.
4. Construir shell responsivo, tokens, mascotes originais e cinco áreas.
5. Permitir exploração financeira e do desafio em memória, sempre com dados fictícios sinalizados.
6. Preparar clientes Supabase, autenticação, migração RLS e trilha de auditoria.
7. Preparar regras independentes de recompensa e porta de IA sem APIs pagas.
8. Executar verificações e registrar evidências e pendências em VALIDATION.md.

Entregas da fundação já validada: documentação, app local, modo demo, infraestrutura de dados fechada para escrita, autenticação preparada e testes. A seleção simples e persistente de espécie foi adicionada como incremento pendente da Sprint 01. Não inclui produto financeiro pronto para produção, persistência financeira, API de IA, economia virtual ou criação complexa de personagens.

## Sprint 02 — Primeiro fluxo real e seguro

Revisão financeira de 22/10/2026: [FINANCIAL_AUDIT.md](FINANCIAL_AUDIT.md). O banco agora valida a matemática da campanha 1–200, mas os números da interface continuam exclusivamente em memória e reiniciam no reload. Antes de persistir, falta definir saldo inicial, saldo por conta/livre, autorização de operações e concorrência nas RPCs.

Pré-requisito: configurar Supabase de desenvolvimento e executar a migração e testes SQL.

- Definir convite bilateral, limite de dois participantes ativos e regras de saída/retenção/exportação.
- Concluir onboarding, confirmação de e-mail, recuperação e proteção de todas as rotas reais.
- Gerar tipos do banco e implementar repositórios sem fixtures em modo real.
- Criar RPCs transacionais para contas, receitas/despesas, transferências, reserva e reversão; derivar ator no servidor.
- Validar dono/escopo das contas, idempotência, datas, centavos e saldo livre sob concorrência.
- Ligar formulários à persistência com erros acionáveis, estados vazios e confirmação explícita de reversões reais.
- Testar dois casais separados, parceiro com leitura individual, tentativa de escrita alheia, vínculo revogado, campos forjados e mutações concorrentes.
- Integrar Realtime somente após autorização comprovada; tratar reconexão e refetch.

Aceite: duas contas reais conseguem usar o fluxo diário e a meta sem duplicações; outro casal não lê nem altera dados; não há fallback silencioso para demo.

## Sprint 03 — Organização do dia a dia

- Validar com o casal as necessidades de contas, períodos, categorias e compromissos antes de implementá-las.
- Priorizar revisão financeira simples, clareza de reservas e acompanhamento do casamento.
- Evoluir campanhas personalizadas sobre regras validadas.
- Testar instalação PWA em celulares; decidir política offline sem cache de dados sensíveis por padrão.

Aceite: o casal consegue entender a situação financeira e combinar o próximo passo sem depender de uma planilha paralela para os fluxos cobertos.

## Sprint 04 — Motivação com propósito

- Persistir eventos canônicos/outbox e regras versionadas de recompensas.
- Testar reenvios, edições, concorrência e compensação de reversões.
- Introduzir XP/níveis e moedas virtuais, depois inventário e itens cosméticos originais.
- Evoluir missões individuais/conjuntas, conquistas, equipamentos e cenário compartilhado conforme uso real.

Aceite: recompensa deriva de hábito saudável, não de renda ou volume movimentado. Nenhuma duplicação ou edição concede prêmio repetido.

## Depois da base validada — Voz, IA e SaaS

Primeiro avaliar custo e privacidade. Implementar interpretação como proposta confirmável pelo usuário, sujeita ao mesmo comando das entradas manuais. Preparar limites de uso, logs sem dados desnecessários e testes de propostas ambíguas. Somente então avaliar operação para vários casais, suporte, backups/restauração, observabilidade e cobrança. Nada disso é promessa de entrega da Sprint 01.

## Decisões abertas

- Nome final, orçamento e data desejada para o casamento.
- Contas que serão controladas e tratamento de saldos iniciais.
- Consentimento, revogação e histórico após término de relacionamento.
- Regras de nível, XP e limite de recompensas, sem pressão por renda.
- Convites, política futura de permissões e forma de exportação.

Não preencher essas decisões com informações inventadas. A Sprint 01 deve continuar explorável sem elas.
