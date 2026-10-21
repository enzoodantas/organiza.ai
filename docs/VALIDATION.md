# Validação — Sprint 01

Data: 21/10/2026. Ambiente: Linux, Node 24.21.0, npm 11.19.0. Versões efetivas registradas em package-lock.json.

## Resultado verificável

| Verificação | Resultado |
| --- | --- |
| TypeScript strict (`npm run typecheck`) | Passou |
| ESLint (`npm run lint`) | Passou, sem avisos de código |
| Vitest (`npm test`) | 31 testes passaram, em 2 arquivos |
| Produção (`npm run build`) | Passou; rotas geradas e /conta dinâmica |
| Playwright com Chrome instalado | 10 testes passaram; projetos mobile e desktop |
| Largura de 320 px | Cinco áreas sem rolagem horizontal, com movimento reduzido |
| Manifest e ícones PNG | Respostas HTTP válidas verificadas no navegador |
| `git diff --check` | Passou |
| `npm audit --omit=dev` | Zero vulnerabilidades reportadas |
| `npm audit` completo | 5 alertas altos na cadeia de desenvolvimento do lint; pendência abaixo |
| Supabase Auth externo / SQL RLS / Realtime | Não executados: sem credenciais, PostgreSQL, Docker ou CLI Supabase neste ambiente |

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

## Preparado, sem validação externa

Login Supabase por e-mail/senha, renovação de cookies, validação de usuário no servidor e saída implementados para configuração externa. Migração SQL define modelo, constraints, RLS de leitura, bloqueio de escrita de negócio, índices de idempotência, auditoria e publicação Realtime. Contrato de IA e esboço puro de recompensas não chamam provedores nem persistem prêmios.

O script `supabase/tests/isolation.sql` prepara testes PostgreSQL com fixtures sintéticas e rollback: leitura do parceiro, isolamento de tenants/contas/perfis/auditoria, vínculo revogado, usuário anônimo e bloqueio de escrita/forja de membros. **Não foi executado aqui.** Aplicação da migração, comportamento dos gatilhos, Auth remoto e políticas SQL não são declarados validados.

## Limites e próximo passo

Atualização de requisito na Sprint 01: seleção individual de espécie incorporada ao PRD, arquitetura e roadmap. Esta atualização altera somente documentação. Catálogo/FK, operação de seleção persistente e seletor de UI ainda não foram implementados nem testados; as garantias de preservação de progressão/inventário são contratos para as respectivas implementações. O componente e as telas atuais ainda exibem os animais iniciais fixos. Os resultados de testes acima pertencem à fundação entregue e não comprovam a seleção personalizável. Para esta atualização documental, verificar consistência dos requisitos e `git diff --check`; não é necessário repetir build/testes de código inalterado.

- Sem persistência financeira real, onboarding, convites, CRUD real de contas, transferências reais ou RPCs transacionais de aporte/reversão. A demonstração não gerencia saldo livre por conta.
- Escritas reais deliberadamente bloqueadas. Não liberar grants/políticas de escrita antes de validar autorização, escopo, idempotência e concorrência nas operações de aplicação.
- Sem distribuição de XP/moedas, níveis, inventário, missões, itens ou cenário evolutivo. Esboço de motor depende de chaves canônicas confiáveis e persistência transacional futura.
- Sem voz, API de IA, assinaturas Realtime da interface, funcionamento offline, notificações ou teste de instalação em celular físico.
- Autenticação configurada não muda a origem dos dados financeiros: todas as áreas seguem em demo com aviso persistente.

Próxima entrega: configurar Supabase descartável, executar migração/testes SQL, completar consentimento/onboarding do casal e implementar o primeiro fluxo financeiro persistente com RPCs, auditoria e testes de dois tenants.
