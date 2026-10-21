# Planejamento e roadmap — Nosso Futuro

## Norte permanente

**Nos ajudar na vida financeira individual e a dois, começando pela organização do dinheiro e pela poupança para o casamento.** Priorizar uso simples, números confiáveis e decisões compartilhadas. Consultar PRD.md antes de ampliar o escopo. Gamificação apoia os hábitos; não pode atrasar a utilidade financeira básica.

## Sprint 01 — Fundação

### Registro de entrega e ponto de retomada — 21/10/2026

A fundação foi implementada e validada localmente. O usuário solicitou registrar as pendências e enviar a entrega para `main`, deixando a revisão visual para depois. O envio do código não representa publicação do aplicativo nem ativação de dados reais.

Estado entregue: cinco áreas responsivas, mascotes originais, movimentações e desafio em demonstração, documentação, base de autenticação e migração de dados. TypeScript, lint, build, 31 testes unitários/de componentes e 10 testes de navegador passaram. Evidências e limites estão em [VALIDATION.md](VALIDATION.md).

**Retomar pelo Supabase de desenvolvimento e pelo primeiro fluxo financeiro persistente.** Não iniciar inventário, animações adicionais ou IA antes de tornar o registro financeiro confiável e útil para o casal.

Pendências, em ordem de execução:

- [ ] Revisar a demonstração com o casal quando houver disponibilidade; confirmar se a navegação e os resumos ajudam a entender e organizar o dinheiro.
- [ ] Configurar um Supabase de desenvolvimento com variáveis reais apenas em `.env.local`, seguindo o README; nenhuma credencial foi criada nesta entrega.
- [ ] Aplicar a migração em ambiente descartável e executar `supabase/tests/isolation.sql`; RLS e gatilhos ainda não foram testados em PostgreSQL.
- [ ] Testar login, renovação de sessão e saída contra Supabase; concluir onboarding, confirmação e recuperação de acesso.
- [ ] Definir convite e consentimento de ambos, limite de participantes ativos e comportamento ao revogar um vínculo.
- [ ] Implementar RPCs transacionais para contas, receitas/despesas, transferências, reservas e reversões, com autorização no servidor/banco e auditoria.
- [ ] Validar saldo livre por conta, centavos, escopos, idempotência e concorrência. Manter as escritas reais bloqueadas até essas verificações passarem.
- [ ] Conectar a interface a dados persistidos, gerar tipos do banco e testar dois casais isolados, sem fallback silencioso para demonstração.
- [ ] Ligar e validar as assinaturas Realtime após o fluxo persistente estar seguro.
- [ ] Acompanhar a correção dos cinco alertas da cadeia de desenvolvimento do lint e a compatibilidade para atualizar ESLint. Auditoria de produção desta entrega: zero alertas.
- [ ] Validar instalação PWA em celular físico; offline e sincronização ainda não estão implementados.
- [ ] Evoluir recompensas, inventário, missões e cenário somente após validar a utilidade financeira básica. Voz/IA continuam futuras e sem API paga integrada.

Decisões a confirmar no momento adequado: nome final do produto, nome da Pessoa A, contas e saldos iniciais, orçamento/data do casamento e política de retenção/exportação após saída do relacionamento. Não presumir essas informações na implementação.

Ordem de implementação acordada:

1. Inspecionar ambiente e repositório; conferir versões e compatibilidade.
2. Documentar produto, arquitetura, modelo de dados, acesso e limites.
3. Configurar Next.js/TypeScript, Tailwind/shadcn e integrações mínimas.
4. Construir shell responsivo, tokens, mascotes originais e cinco áreas.
5. Permitir exploração financeira e do desafio em memória, sempre com dados fictícios sinalizados.
6. Preparar clientes Supabase, autenticação, migração RLS e trilha de auditoria.
7. Preparar regras independentes de recompensa e porta de IA sem APIs pagas.
8. Executar verificações e registrar evidências e pendências em VALIDATION.md.

Entregas: documentação, app local, modo demo, infraestrutura de dados fechada para escrita, autenticação preparada e testes. Não inclui produto financeiro pronto para produção, persistência financeira, API de IA, economia virtual ou personalização de personagens.

## Sprint 02 — Primeiro fluxo real e seguro

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

- Nome final, nome da Pessoa A, orçamento e data desejada para o casamento.
- Contas que serão controladas e tratamento de saldos iniciais.
- Consentimento, revogação e histórico após término de relacionamento.
- Regras de nível, XP e limite de recompensas, sem pressão por renda.
- Convites, política futura de permissões e forma de exportação.

Não preencher essas decisões com informações inventadas. A Sprint 01 deve continuar explorável sem elas.
