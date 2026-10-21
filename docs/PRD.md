# Nosso Futuro — PRD

## A ideia que não pode se perder

**Existimos para ajudar na nossa vida financeira: entender o dinheiro, cuidar do presente e preparar o casamento e o futuro a dois.** O produto só faz sentido se reduzir a confusão, facilitar conversas e apoiar decisões reais. Gamificação, personagens e futura IA são meios de incentivar esse cuidado.

Nome provisório: Nosso Futuro. Repositório originalmente chamado organiza.ai. Usuários iniciais: Pessoa A (gato) e Letícia (cachorrinho). Não presumir nome, renda, patrimônio ou prazo do casamento. Todos os valores fornecidos pela demonstração são fictícios.

## Problema e objetivos

- Centralizar receitas, despesas e contas individuais e compartilhadas.
- Mostrar o que entrou, saiu e está reservado, sem contar o mesmo dinheiro duas vezes.
- Acompanhar a poupança do casamento e as responsabilidades de cada participante.
- Criar constância sem vergonha, competição por renda ou punições por dificuldades.
- Começar com um casal e manter isolamento entre múltiplos relacionamentos desde o modelo inicial.

Valores cristãos: boa administração, honestidade, planejamento, contentamento e generosidade. Linguagem respeitosa e acolhedora. Não associar saldo financeiro a mérito espiritual. Não pressionar ofertas ou doações.

## Critério para priorizar qualquer funcionalidade

1. Qual dificuldade financeira real do casal ela resolve?
2. Ajuda a compreender, registrar, planejar ou poupar com menos esforço?
3. Preserva privacidade, integridade do dinheiro e autonomia individual?
4. É mais necessária agora do que melhorar o fluxo financeiro básico?

Se essas respostas não forem claras, registrar no backlog, sem aumentar o escopo da sprint. Não adicionar rede social, marketplace, investimentos automatizados, integração bancária ou monetização nesta fundação.

## Áreas e contratos de experiência

| Área | Fundação da Sprint 01 | Evolução posterior |
| --- | --- | --- |
| Início | Visão consolidada fictícia, progresso, personagens e comparação de receitas/despesas | Dados reais por período, contas e metas |
| Finanças | Filtros individual/conjunto, registro e reversão em memória | Persistência, contas, transferências e conciliação |
| Desafios | Grade 1–200, aporte, responsável, histórico, reversão e progresso em memória | Reserva real vinculada a conta e campanhas personalizadas |
| Mascotes | Gato e cachorrinho originais, prévia identificada | XP, níveis, itens, missões, conquistas e cenário |
| Perfil | Troca de participante fictício para explorar permissões | Identidade real, vínculo, convites e configurações |
| Conta | Login preparado, validação de usuário no servidor e saída | Onboarding completo e recuperação de conta |

## Regras inegociáveis

- Identidade e dados financeiros próprios para cada pessoa. Leitura do parceiro somente dentro de relacionamento ativo autorizado.
- Padrão: cada pessoa altera seus registros individuais; ambas operam os compartilhados. Configuração futura de permissões deve ser versionada e auditada.
- Ser participante de um casal não concede acesso a outros. Revogar vínculo encerra a leitura correspondente. A política de saída, retenção e exportação será definida antes do uso real.
- Valores em BRL e centavos inteiros positivos; não aceitar NaN, frações de centavo ou valores fora do limite suportado.
- Receita aumenta saldo; despesa reduz saldo. Transferência move entre contas e tem efeito consolidado zero. Aporte reserva dinheiro já existente: não cria receita nem aumenta patrimônio.
- Correções financeiras preservam histórico. Reversões devem ser atômicas e auditadas; exclusão destrutiva não faz parte do fluxo.
- Dinheiro real e moedas virtuais nunca compartilham saldo ou significado.

## Desafio dos R$ 20.100

A soma de 1 a 200 é 20.100 reais, ou 2.010.000 centavos. Cada número corresponde a um único aporte ativo do mesmo valor em reais. Registrar campanha, participante, conta de origem, instante e chave de idempotência. Histórico inclui reversões e seus responsáveis. Um número revertido pode receber novo aporte, preservando o anterior.

O progresso conjunto soma os aportes ativos; o individual filtra o participante responsável. A grade deve funcionar em telas pequenas sem rolagem horizontal. Banco impede duas reservas simultâneas do mesmo número por índice único parcial. A futura operação transacional deve validar também as regras da campanha e o saldo livre da conta. A demonstração ainda não valida saldo disponível por conta, pois não representa reservas reais.

## Gamificação responsável

Recompensar hábitos verificáveis, como primeira organização e revisão semanal; não o volume de dinheiro, o número indiscriminado de lançamentos ou a edição de um registro. Sem perda de XP por dificuldades financeiras. A regra de revisão semanal deverá usar chave canônica de usuário/relacionamento/semana; o evento de primeira movimentação deverá usar uma chave única de marco, nunca um UUID arbitrário fornecido pelo cliente.

O motor recebe eventos de domínio confiáveis, consulta regras versionadas e produz recompensas idempotentes. Atualizações ou reenvios não criam eventos novos. Estornos terão eventos compensatórios e política explícita, sem apagar histórico. Níveis, moedas, cosméticos, inventário, equipamentos, missões, conquistas e cenário compartilhado são backlog; não há economia virtual ativa nesta sprint.

## IA e voz

Reservar espaço de interface e uma porta de interpretação tipada. Não contratar ou chamar API paga. No futuro: áudio → transcrição → proposta estruturada → revisão humana → comando validado → autorização → transação. A IA não acessa chaves privilegiadas nem grava diretamente no banco. Não enviar informações financeiras a provedores sem decisão explícita de privacidade.

## Qualidade e critérios de aceite

- Navegação nas cinco áreas, experiência de 320 px a desktop, formulário acessível por teclado, foco visível e respeito a movimento reduzido.
- Modo de demonstração sempre identificado; dados e ações fictícias não apresentados como conexão real. Recarregar reinicia a sessão fictícia.
- Ações visíveis têm resultado real no modo anunciado. Recursos futuros são texto informativo, sem botões que aparentem funcionar.
- Estados de carregamento, erro, ausência de configuração e listas vazias.
- Autenticação, banco e Realtime só podem ser chamados de integrados após teste no Supabase configurado.
- TypeScript strict, lint, testes e build executados; limitações registradas em VALIDATION.md.

## Como medir se estamos ajudando

Antes de implementar telemetria, validar com o casal: conseguimos responder quanto entrou, quanto saiu, quanto está reservado e qual é o próximo passo do casamento? Medir posteriormente esforço para registrar, frequência de revisão e consistência da meta. Não coletar métricas financeiras identificáveis sem necessidade e consentimento.
