# Auditoria financeira e de persistência — 22/10/2026

> Registro da revisão inicial, anterior às migrações financeiras `004/005/006`. O estado atual de operações locais e seus testes está em [VALIDATION.md](VALIDATION.md). As barreiras abaixo descrevem o que faltava nesta revisão; algumas já foram resolvidas no Supabase local.

## Resposta direta

A grade de 1 a 200 aceita um número disponível por clique/teclado ou pelo campo numérico. O usuário confirma o aporte fictício no formulário. O número fica marcado, aparece no histórico e pode ser revertido; após reversão, ele volta a ficar disponível e o registro antigo continua visível. **Essas ações ainda não são gravadas no Supabase.** O estado React é reiniciado ao recarregar a página. A consulta de contagens do PostgreSQL local nesta data encontrou zero linhas em `profiles`, `relationships`, `accounts`, `financial_entries`, `campaigns`, `contributions` e `audit_events`.

O banco tem estrutura para guardar lançamentos, aportes, reversões e auditoria. As tabelas financeiras ainda negam escrita a `authenticated`/`anon`; não existem RPCs de movimentação nem vínculo ativo. A UI não as consulta. Por isso, a existência das tabelas e gatilhos **não significa memória financeira ativa do aplicativo**.

## Cálculos revisados

| Regra | Estado verificado |
| --- | --- |
| Valores monetários | Entrada aceita centavos inteiros positivos, sem separador de milhar ambíguo; agregações rejeitam ultrapassar a precisão inteira do JavaScript. Formatação separa reais e centavos com `BigInt`, sem dividir por número de ponto flutuante. |
| Data da demonstração | Novos registros usam a data local do navegador; a versão anterior cortava a data UTC e podia mostrar o dia errado perto da meia-noite. O fluxo real ainda precisará de regra explícita de fuso para `occurred_on`. |
| Receitas e despesas | `summarize` exclui reversões, transferências e reservas da diferença `receitas − despesas`. O painel agora chama essa diferença de **resultado dos lançamentos**, pois não há saldo inicial nem saldo por conta. |
| Transferência | O esquema exige duas contas distintas no mesmo relacionamento. Não há operação transacional, consulta de saldo por conta ou UI real para transferir. |
| Desafio 1–200 | A soma é R$ 20.100. Cada número vale seu valor em reais; progresso soma apenas aportes ativos, com totais por participante. Reversão retira o valor do progresso. |
| Duplicidade | A demonstração verifica número ativo; o banco tem índice único parcial para impedir dois aportes ativos no mesmo slot. O estado da demonstração foi ajustado para verificar submissões sucessivas antes do próximo render. |
| Regras da campanha | Migração `202610220001_campaign_integrity.sql` verifica faixa, unidade, meta total e valor de cada aporte. Depois do primeiro aporte, regra e meta não podem mudar. Continua sem conceder escrita financeira ao cliente. |
| Auditoria | Gatilhos registram inserção, atualização e exclusão de lançamentos, aportes e recompensas em `audit_events`, com dados antes/depois. Teste SQL local confirmou inserção, reversão e nova reserva do mesmo número com três eventos de auditoria e histórico preservado. |

## Barreiras para dinheiro real

1. **Onboarding e autorização:** os convites locais ainda aguardam aceitação; perfis, relacionamento e consentimento não existem. Definir limite de membros ativos, revogação e acesso histórico antes de criar dados reais.
2. **Livro de contas:** definir saldo inicial explícito e data de corte; distinguir fluxo de um período, saldo total por conta e saldo livre (`saldo − reservas`). Um saldo inicial não pode ser tratado como receita comum sem decisão de produto. Derivar saldos de eventos íntegros no banco usando `bigint`/`numeric` e transportar totais como texto/`bigint` até a camada de apresentação.
3. **RPCs transacionais:** registrar receita, despesa, transferência, aporte e reversão com usuário derivado de `auth.uid()`, vínculo ativo, dono/escopo de cada conta, chave idempotente ligada ao mesmo payload e auditoria na mesma transação. Operações que afetam uma conta precisam serializar por conta e conferir saldo livre sob concorrência. Reservar saldo não cria receita; reverter despesa ou transferir dinheiro não pode deixar reservas sem cobertura.
4. **Integridade adicional:** `contributions` já verifica slot/valor com a migração nova, mas ainda não comprova saldo disponível, titularidade ativa da conta nem autorização do participante. `financial_entries` verifica formato e relacionamento das contas, mas ainda não vincula escopo da operação à permissão do usuário e das contas. Essas verificações entram nas RPCs e em testes PostgreSQL antes de conceder `EXECUTE`.
5. **Importação e conciliação:** receber extrato do último mês, apresentar proposta revisável, conferir período, conta, centavos, duplicatas, saldos iniciais e totais antes de gravar. Repetição do arquivo ou da requisição não pode duplicar lançamentos.
6. **Memória operacional:** auditoria atual cobre três tabelas, não contas, campanhas, vínculos ou ações de login. Ainda faltam política de retenção, backups/restauração testados, identificação de operador para ações administrativas e exportação. `audit_events` é histórico interno com acesso restrito, não um mecanismo de backup.

## Validação desta revisão

- Migração aplicada ao Supabase local e ao projeto remoto **de desenvolvimento** após dry-run listar somente a migração nova; `db lint --linked --fail-on error` sem erros.
- Teste SQL local `supabase/tests/campaign_integrity.sql` executado com `ROLLBACK`: valor e faixa inválidos, duplicidade ativa, meta inconsistente e mudança de regra com histórico rejeitados; reversão e nova reserva aceitas; auditoria conferida.
- TypeScript, ESLint, 32 testes Vitest, build Next/Webpack, 10 cenários Playwright em desktop/mobile e `git diff --check` passaram. Os testes de interface representam a demonstração, não persistência ou saldo real.

**Próximo aceite financeiro:** duas contas autenticadas, relacionamento consentido, operações RPC transacionais e testes de isolamento/concorrência/centavos com saldo inicial e saldo livre reconciliados. Só então ligar as telas ao banco e começar a importação real.
