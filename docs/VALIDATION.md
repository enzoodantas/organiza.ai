# Validação — Sprint 01

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
