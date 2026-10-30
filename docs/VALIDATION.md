# Validação — fundação e Sprint 02 local

## Operações financeiras locais — 22/10/2026

As migrações `202610220004_financial_operations.sql`, `202610220005_financial_lock_order.sql` e `202610220006_account_idempotency.sql` foram aplicadas somente ao Supabase local, sem apagar contas ou estimativas. `supabase/tests/financial_operations.sql` passou com rollback: saldos inicial/total/livre, centavos, idempotência de contas e lançamentos, gasto sem cobertura, reserva, reversão com cobertura, auditoria, leitura do parceiro, proibição de escrita em conta individual alheia, isolamento de outro casal, membro revogado, anônimo e ausência de escrita direta. O smoke `tests/real-finance-smoke.mjs` passou em Chrome com usuário sintético: login, conta, receita, reserva, reload, telas a 320 px, reversões e duas despesas concorrentes disputando o mesmo saldo. A fixture foi removida; conferência posterior encontrou somente as duas contas Auth do casal, um cofrinho, um saldo inicial e zero lançamentos/aportes reais. Os 10 cenários Playwright da demonstração também passaram em desktop/mobile.

TypeScript, ESLint, 32 testes Vitest, build de produção com Webpack e `git diff --check` passaram. `db lint --local --fail-on error` não encontrou erros. O build Turbopack falhou neste ambiente ao tentar abrir porta de processo auxiliar (`Operation not permitted`); o build Webpack concluiu todas as rotas. Ainda falta testar as duas sessões reais nas novas telas, política de saída/exportação, migração para ambiente publicado, Realtime e restauração de backup. As seções da Sprint 01 abaixo são um registro histórico anterior a este incremento.

## Onboarding local — 22/10/2026

A migração `202610220002_onboarding.sql` foi aplicada somente ao Supabase local. TypeScript, ESLint, `git diff --check` e `db lint --local --fail-on error` passaram na implementação. Antes do aceite, consultas com os papéis autenticados mostraram: Enzo via seu perfil, o espaço e seu próprio vínculo; Letícia via seu perfil e o convite recebido, mas nenhum relacionamento ou membro. Após Letícia aceitar na própria conta, o banco passou a ter dois perfis, um relacionamento, dois membros ativos, um convite aceito e nenhum convite pendente. Consultas com o papel de cada pessoa mostraram dois perfis, um relacionamento, dois membros e zero convites pendentes para ambas. Elas não têm escrita direta em `financial_entries` nem leitura direta na tabela de convites. Login/saída e renovação de sessão pela interface ainda não foram verificados nesta etapa. Nenhum teste de suíte foi acrescentado ou executado.

## Revisão financeira de 22/10/2026

Ver [FINANCIAL_AUDIT.md](FINANCIAL_AUDIT.md) para o estado da memória financeira, cálculos e pendências antes do uso real. A migração `202610220001_campaign_integrity.sql` foi aplicada localmente e ao Supabase remoto de desenvolvimento; teste SQL transacional local passou com rollback e `db lint --linked --fail-on error` não encontrou erros. TypeScript, lint, 32 testes Vitest, build Next/Webpack, 10 cenários Playwright em desktop/mobile e `git diff --check` passaram nesta revisão. A grade 1–200 agora permite escolher um número por clique ou teclado, mas segue em demonstração sem persistência.

Data: 21/10/2026. Ambiente: Linux, Node 24.21.0, npm 11.19.0. Versões efetivas registradas em package-lock.json.

## Resultado verificável

| Verificação | Resultado |
| --- | --- |
| TypeScript strict (`npm run typecheck`) | Passou |
| ESLint (`npm run lint`) | Passou, sem avisos de código |
| Vitest (`npm test`) | 31 testes passaram, em 2 arquivos |
| Produção (`npx next build --webpack`) | Passou; rotas geradas e /conta dinâmica. `npm run build`/Turbopack não pôde abrir processo auxiliar neste ambiente |
| Playwright com Chrome instalado | 10 testes passaram; projetos mobile e desktop, incluindo os nomes Enzo e Letícia |
| Largura de 320 px | Cinco áreas sem rolagem horizontal, com movimento reduzido |
| Manifest e ícones PNG | Respostas HTTP válidas verificadas no navegador |
| `git diff --check` | Passou |
| `npm audit --omit=dev` | Zero vulnerabilidades reportadas |
| `npm audit` completo | 5 alertas altos na cadeia de desenvolvimento do lint; pendência abaixo |
| Supabase CLI / banco remoto de desenvolvimento | Organização e projeto criados pela CLI; migrations `202610210001` e `202610210002` aplicadas e listadas no histórico remoto |
| Lint SQL remoto | Passou: `npx supabase db lint --linked --fail-on error`, sem erros de schema |
| Verificação remota de RLS/grants | Passou em consulta de catálogo: 10 tabelas com RLS; authenticated sem `UPDATE` direto; RPC permitida a authenticated e negada a anon |
| Smoke test remoto de `select_mascot` | Passou com dois usuários sintéticos: escolhas iguais e independentes, troca de um sem alterar o outro e rejeição de espécie desconhecida; fixtures removidas na mesma operação |
| Docker rootless | Engine 29.9.2/Compose 5.6.1 instalados; daemon rootless ativo; imagem oficial `hello-world` executada com sucesso |
| Supabase local | Stack mínima ativa (Postgres, Auth, REST, Kong e Mailpit); endpoints locais Auth/Mailpit responderam HTTP 200 |
| Migrations e lint locais | Duas migrations aplicadas; `npx supabase db lint --local --fail-on error` sem erros |
| Isolamento SQL local | `supabase/tests/isolation.sql` passou no container Postgres; fixtures foram revertidas pelo `ROLLBACK` |
| Signup público / Auth de usuários | Cadastro público desativado na instância local e remota; dois convites locais criados para Enzo e Letícia, ainda não aceitos. Mailpit contém duas mensagens; login real ainda não testado |
| Realtime local/remoto | Não executado; serviço local foi excluído para reduzir consumo e interface ainda não assina eventos |

Comando de navegador usado neste ambiente:

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/google-chrome npm run test:e2e
```

Playwright controla Chrome em contextos desktop e mobile; não representa teste em dispositivo físico ou no Safari/WebKit. O navegador instalado foi usado porque o download padrão tentou escrever em cache fora dos diretórios permitidos. Build e navegador precisaram de execução autorizada fora do sandbox: Turbopack e servidor Next.js abrem portas locais.

## Cobertura efetiva

- Conversão decimal para centavos, entradas inválidas, limite por movimentação e exclusão de transferências, reservas e registros revertidos do consolidado.
- Leitura pelo parceiro, edição individual pelo dono, edição conjunta, negação a outros casais e vínculos revogados nas funções de domínio.
- Soma exata de 1 a 200; rejeição de slot inválido/duplicado; reversão reabre slot sem apagar histórico; progresso individual/conjunto.
- Deduplicação por chave canônica e configuração do esboço de regras de recompensas.
- Formulários críticos: erros de valor, registro fictício, reversão e aporte duplicado.
- Navegação das áreas, ausência de erros JavaScript na jornada inicial, autenticação sem configuração redirecionando /conta para /entrar.
- Troca de participante mantém leitura individual do parceiro e restringe o botão de reversão; testes de UI não constituem autorização de produção.
- Revisão visual por capturas desktop e mobile; corrigidos o overflow dos totais em 320 px, contraste do botão principal e disposição da ilustração em telas pequenas.

## Segurança de dependências

A auditoria completa sinalizou `braces <=3.0.3` por esgotamento de pilha ao processar padrões profundamente aninhados, propagado por micromatch → fast-glob → @next/eslint-plugin-next → eslint-config-next. `npm view braces version` retornou 3.0.3, sem versão corrigida publicada consultada. O npm sugeriu downgrade do eslint-config-next para 14.2.35; não foi aplicado por incompatibilidade com a fundação Next 16 e por não constituir correção direta do pacote afetado.

Referência: [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). A auditoria sem dependências de desenvolvimento retornou zero alertas. Manter acompanhamento e atualizar a cadeia de lint quando houver correção compatível. ESLint 9 também emitiu aviso de fim de suporte durante instalação; migração para a versão principal atual deve ser acompanhada de compatibilidade dos plugins. Não houve `audit fix --force` nem ocultação de alertas.

## Funcional nesta sprint

App local com cinco áreas responsivas; dados fictícios em memória; receitas/despesas, filtros, reversão e consolidação; desafio com responsável, histórico e progresso; personagens originais; navegação mobile e atalho ao formulário; estados básicos de erro/carregamento/vazio e configuração ausente. PRD, arquitetura, roadmap, exemplo de ambiente e instruções locais disponíveis.

## Preparado e validado nos ambientes Supabase

Projeto remoto de desenvolvimento criado pela CLI em `sa-east-1` (São Paulo), vinculado ao repositório; as duas migrations foram aplicadas e conferidas. A aplicação local aponta para o Supabase Docker em `http://127.0.0.1:54321`; os dados de acesso remoto e chaves administrativas locais ficam em `supabase/.env.local`, ignorado e com permissão restrita. O daemon Docker roda rootless e não concede acesso ao grupo `docker`.

O lint local e remoto passou. O teste SQL local de dois tenants passou: leitura do parceiro, isolamento entre casais, perfil revogado, usuário anônimo, tentativas de forjar vínculo, escrita financeira e apagamento de auditoria; tudo foi revertido. O teste remoto de mascote e os grants/RLS também foram conferidos. Cadastros públicos estão desativados nas duas instâncias. Foram criados convites apenas no Auth local para os dois usuários autorizados; os links ficam no Mailpit em `http://127.0.0.1:54324` e ainda precisam ser aceitos. Os convites não foram enviados por serviço de e-mail externo. Perfis e relacionamento não foram provisionados, aguardando confirmação dos dois. Login real ainda não foi testado.

## Limites e próximo passo

Atualização de requisito na Sprint 01: `202610210002_mascot_species.sql` foi aplicada no Supabase de desenvolvimento e a RPC passou smoke test sintético. Seletor da interface ainda não implementado; componentes e telas continuam exibindo os mascotes iniciais fixos. As garantias de preservação de progressão/inventário são contratos para sistemas futuros, não funcionalidades testadas. A validação de RPC não substitui o teste completo de isolamento SQL.

- Sem persistência financeira real, onboarding de relacionamento, aceitação/validação dos dois convites, CRUD real de contas, transferências reais ou RPCs transacionais de aporte/reversão. A demonstração não gerencia saldo livre por conta.
- Escritas reais deliberadamente bloqueadas. Não liberar grants/políticas de escrita antes de validar autorização, escopo, idempotência e concorrência nas operações de aplicação.
- Sem distribuição de XP/moedas, níveis, inventário, missões, itens ou cenário evolutivo. Esboço de motor depende de chaves canônicas confiáveis e persistência transacional futura.
- Sem voz, API de IA, assinaturas Realtime da interface, funcionamento offline, notificações ou teste de instalação em celular físico.
- Autenticação configurada não muda a origem dos dados financeiros: todas as áreas seguem em demo com aviso persistente.

Próxima entrega: aceitar os convites locais e validar login/sessão; provisionar perfis e vínculo do casal com consentimento de ambos. Em seguida, implementar importação revisável do último mês sobre RPCs transacionais e auditoria. Nenhum arquivo de extrato foi recebido nesta tarefa e ainda não existe fluxo seguro para importar ou gravar lançamentos reais.


## Revisão por Context7 — 27/10/2026

- TypeScript e ESLint passaram; `git diff --check` sem erros.
- Vitest: 37 testes passaram. Novos cenários cobrem histórico de 503 registros sob limite menor do servidor, falha intermediária sem resultados parciais, páginas sobrepostas, filtros por mês/conta/tipo e exclusão de transferências/reversões dos totais mensais.
- Build `npx next build --webpack` passou fora do sandbox. Dentro dele, houve falha do subprocesso ao interpretar `tsc --showConfig`; a execução externa resolveu.
- Playwright com Chrome instalado: 10/10 cenários da demonstração passaram em mobile/desktop, incluindo 320 px, navegação, registros/reversões e PWA.
- Não executados nesta rodada: smoke autenticado com banco, expiração real de sessão das duas pessoas, suítes SQL ou revisão em celular físico. As telas autenticadas receberam testes de componentes com fixtures sintéticas; isso não substitui aceite das duas sessões.
- Nenhuma migração, gravação de dados pessoais, publicação ou alteração remota. Para evolução de relatórios grandes/concorrentes, consultar os limites da leitura paginada em ARCHITECTURE.md.


## Preparação de deploy — 27/10/2026

- `npm run build` final (Webpack, saída padrão) passou; configuração standalone também compilou durante a preparação. `build:deploy` ativa standalone explicitamente, mantendo `npm start` compatível com o build padrão.
- TypeScript, ESLint, 40 testes Vitest e `npm run test:deployment` passaram. Os testes de deploy recusam localhost/URL privada/chave administrativa, verificam cópia de assets sem arquivos privados e rejeitam pacote de outro destino. Callback PKCE testado para recuperação, código expirado, bloqueio de redirecionamento externo e origem pública atrás de proxy.
- Playwright: 10 cenários da demonstração passaram em mobile/desktop durante a preparação standalone. O start dessa configuração emitiu aviso, resolvido ao tornar standalone exclusivo de `build:deploy`; o build padrão final passou depois da correção.
- Consultas remotas somente de leitura: projeto Supabase vinculado retornou `INACTIVE`; conexão SQL remota falhou com tenant indisponível. Migrações remotas não puderam ser reconferidas nessa sessão. Azure autenticado, sem App Service para este app. GitHub autenticado após consulta com rede fora do sandbox.
- Não houve deploy, reativação de projeto, criação de infraestrutura, aplicação de migração remota, convite externo, configuração SMTP, migração de dados ou commit/push. A hospedagem foi perguntada ao usuário e ainda não escolhida. Aprovação de custos não foi presumida.
- Scripts e procedimento de publicação estão no README. Antes de considerar o app online funcional: Supabase ativo e migrado, hospedagem escolhida, SMTP/URLs/templates configurados, contas e dados locais tratados por migração revisada ou onboarding remoto consentido, login/recuperação das duas pessoas validados e backup/exportação/saída definidos.


## Supabase reativado e schema remoto atualizado — 27/10/2026

Após o usuário reativar o projeto pelo painel, `projects list` confirmou ACTIVE_HEALTHY. O dry-run listou exatamente `202610220002` a `202610220006`. Salva cópia privada do schema anterior; `db push --yes` aplicou as cinco migrações sem seeds. `migration list --linked` confirmou oito versões locais/remotas coincidentes; `db lint --linked --fail-on error` sem erros.

Verificações read-only HTTP: Auth health/settings 200; cadastro público desativado, provedor e-mail desativado. REST de accounts/financial_entries/monthly_plan_items/contributions rejeitou leitura anônima com 401 e código 42501. Uma primeira verificação via SDK não trouxe código de erro e foi substituída por requisições REST explícitas para distinguir autorização de falha de transporte.

Não houve importação de usuários/valores locais, e-mail externo, alteração de configuração Auth, deploy ou criação de hospedagem. Nenhum código da aplicação foi modificado nesta rodada; testes/build frontend não repetidos. Estado remoto ativo não constitui validação de login remoto ou uso online das duas pessoas.


## Vercel Hobby publicada — 27/10/2026

- Conta autenticada por device flow; plano Hobby confirmado, sem projetos anteriores. Criado projeto organiza-ai com Node 24; variáveis remotas configuradas em production/preview, sem chaves administrativas.
- Dry-run final: Next.js detectado, 73 arquivos, clientes/tipos Supabase incluídos e ambientes/contexto privado/dados locais excluídos. Corrigido padrão de ignore que inicialmente também excluía src/lib/supabase; nenhuma tentativa de build foi feita com aquele manifesto incorreto.
- TypeScript, ESLint, 44 testes Vitest e teste de empacotamento/configuração de deploy passaram. Novos cenários verificam exigência de login, caminhos públicos de recuperação, modo demo local e falha fechada por ausência de configuração.
- Vercel: build de produção compilou e passou TypeScript; estado READY. Domínio https://organiza-ai-rust.vercel.app; funções em gru1, máquina de build básica do plano.
- HTTP sem sessão: /, /financas e /planejamento retornam 307 para /entrar; /entrar e /recuperar-senha retornam 200; /LOCAL_CONTEXT.md e /.env.local retornam 404. Respostas privadas/sem cache.
- Auth público confirmou external.email=true e disable_signup=true após PATCH específico da API Management, preservando os demais ajustes. Site URL/allowlist usam o domínio final. SMTP personalizado ausente; não houve teste real de envio externo ou login das duas pessoas.
- Nenhum usuário, hash de senha, planejamento ou saldo local foi migrado nesta etapa. Decisão de migração foi perguntada e segue pendente. GitHub automático não conectado; deploy direto autorizado pela CLI.


Na QA visual do login em 320 px, identificado botão flutuante sobrepondo o submit. Corrigido ocultando ações financeiras e navegação mobile antes da autenticação no modo privado. Segundo deploy de produção READY (`dpl_7PK1Qxxm9x4fsGB6KyamdLQ5Nrtm`) compilou/validou TypeScript e preservou o mesmo domínio. Primeiro smoke Chrome do endereço público verificou formulário, recuperação sem enviar e-mail, ausência de nomes no shell e ausência de rolagem horizontal; não equivale a login autenticado. `.env.local` foi ajustado para modo 600 após a CLI adicionar token OIDC. Nenhuma migração de usuários/dados ocorreu.

## Migração e guarda-roupa — 30/10/2026

- Duas identidades importadas pelo Admin Auth preservando UUIDs e hashes; os hashes foram comparados sem exibição. Perfis, vínculo, 18 estimativas e conta/saldo inicial importados em transação, com comparação de todos os campos. Nenhum lançamento/aporte criado, nenhum e-mail enviado.
- Context7 consultado para importação de hashes e segurança de funções SQL; documentação local do Next lida antes das alterações.
- TypeScript, lint, 44 testes Vitest e teste Node de deploy passaram. Build local passou fora do sandbox após a falha conhecida no subprocesso showConfig.
- Suíte SQL de guarda-roupa passou com fixtures e rollback; cobre deduplicação, saldo, propriedade, espécie, slots, escrita direta, parceiro, estranho, revogação e anônimo.
- Smoke autenticado local passou com conta sintética criada/removida: oito revisões concorrentes premiam uma vez; oito retries de compra debitam uma vez; duas compras distintas disputam o mesmo saldo sem excedê-lo. Navegador validou confirmação de compra, vestir, troca de espécie, reload, dashboard e 320 px, sem erros JavaScript. O primeiro smoke detectou associação ambígua do label do seletor; corrigido com id/htmlFor e repetido com sucesso.
- Dez cenários Playwright mobile/desktop da demonstração passaram.
- Dry-run remoto listou apenas `202610300001_mascot_wardrobe.sql`; aplicada pela CLI e lint remoto sem erros.
- Publicação concluída na Vercel: `dpl_EoJR3KvWZaxuV4vGPwwhbNonx3sE`, estado READY; build cloud e TypeScript passaram, domínio público atualizado. A primeira tentativa falhou na conexão; a segunda concluiu. Diagnóstico identificou timeout em conexões diretas do Node; inspeções posteriores usaram o proxy do ambiente.
- Smoke no domínio de produção passou para as duas contas com sessões temporárias verificadas pelo Auth (sem envio de e-mail): cada uma leu os 18 itens, dois perfis/membros e uma conta financeira; seis rotas autenticadas e o guarda-roupa abriram em 320 px sem erros de carregamento ou JavaScript. Sessões de teste encerradas individualmente. Anônimo redirecionado à entrada; `.env.local`, `LOCAL_CONTEXT.md` e `AGENTS.md` retornaram 404.
- Limites: não foi digitada a senha pessoal de nenhuma conta; preservação dos hashes e acesso por sessões temporárias foram verificados separadamente. SMTP/recuperação externa, exportação/backup e saída/retenção continuam pendentes. Nenhum commit/push realizado nesta rodada.
