# Revisão de intuitividade do Nosso Futuro

Data: 30/10/2026. Escopo: navegação, Início, Finanças, Planejamento, Desafios, Mascotes, Perfil, fotos e entrada.

A interface oferece uma base acolhedora e separa estimativas, movimentações e reservas com explicações úteis. As maiores oportunidades de melhoria estão em tornar o próximo passo evidente, usar termos cotidianos e manter os sinais de estado consistentes. A prioridade é reduzir dúvidas na rotina financeira antes de ampliar a personalização.

## Evidência e alcance

Revisão heurística por inspeção dos componentes e CSS do commit `1bd0005`, apoiada por documentação técnica consultada no Context7. O usuário confirmou nesta data login com as duas contas e funcionamento das fotos. Os registros anteriores de validação incluem navegação autenticada e largura de 320 px.

Não houve nova sessão de navegador nesta revisão, medição de contraste, leitor de tela ou observação de tarefas. Os problemas de código abaixo são verificáveis estaticamente; seus impactos sobre comportamento são hipóteses a validar com o casal. Não se atribui nota numérica nem certificação de acessibilidade com essa evidência.

## O que já favorece o uso

- As áreas têm nomes familiares e a navegação marca a página ativa, inclusive com `aria-current`.
- O financeiro explica saldo total, reservado e livre, preservando a distinção entre estimativa e dinheiro efetivo.
- Fotos oferecem prévia, salvar e cancelar; o texto informa quem pode vê-las. O funcionamento foi confirmado pelo usuário.
- Formulários usam controles nativos, mensagens com `role="alert"` e confirmações com `role="status"` em várias operações.
- Há foco visível, atalho para pular ao conteúdo e respeito à preferência por movimento reduzido.
- Compras exigem confirmação e explicitam moedas virtuais. A revisão semanal dispensa sequência e punições.

## Achados e prioridades

P1: corrigir no próximo incremento de usabilidade. P2: melhorar a fluidez em seguida. P3: refinamento após observar o uso. Nenhum item implica falha de autorização no banco.

| Prioridade | Evidência no código | Efeito provável | Melhoria sugerida e aceite |
| --- | --- | --- | --- |
| P1 | `shell.tsx`: a condição do selo não contempla `/perfil`; uma pessoa autenticada cai em “Demonstração”. | Dúvida sobre a persistência da foto e a autenticidade da sessão. | Mostrar estado correspondente à sessão; Perfil autenticado nunca deve receber selo de demonstração. |
| P1 | `shell.tsx` aponta Registrar para `/financas#novo`; `real-finance-view.tsx` não contém `id="novo"`. | O atalho abre a página, mas não leva ao formulário esperado. | Adicionar destino e conferir foco/rolagem; partindo de outra área, chegar diretamente ao registro em desktop e celular. |
| P1 | `monthly-planner.tsx`: “Retirar” arquiva imediatamente, sem confirmação ou desfazer. | Toque acidental remove uma estimativa da lista e muda os totais sem recuperação evidente. | Confirmar com descrição do item ou oferecer desfazer acessível; explicar que o histórico permanece. |
| P1 | No Planejamento, avisos de erro/sucesso ficam depois de todas as seções; campos de parcelas existentes têm nome acessível, mas não rótulo visual persistente. | Em listas longas, pode faltar retorno próximo ao item; o significado de um número preenchido fica menos evidente. | Retorno junto à linha e rótulos visíveis de valor, regularidade e parcelas; identificar claramente qual item foi salvo. |
| P2 | `login-form.tsx`: erro menciona “Auth” e “conta local”; sucesso sempre leva a `/conta`. | Linguagem técnica no ambiente online e passagem extra antes da rotina. | Usar “E-mail ou senha não conferem”; avaliar abrir Início após login com vínculo concluído. Recuperação externa deve funcionar antes de ser considerada resolvida. |
| P2 | `real-challenge-view.tsx`: botão “Reservar no banco”. | Pode sugerir que o app movimenta dinheiro na instituição financeira. | Usar “Confirmar reserva” e manter perto do botão que o dinheiro permanece na conta; o casal deve conseguir explicar esse efeito. |
| P2 | `globals.css`: avisos, notas, metadados e navegação usam vários tamanhos entre 8 e 10 px. | Leitura trabalhosa no celular, especialmente para distinguir saldos e regras. | Aumentar textos de apoio importantes, medir contraste e validar zoom de 200%; preservar hierarquia dos valores. |
| P2 | Seis destinos na barra inferior, rótulos de 9 px e largura mínima de 52 px por link. | Espaço apertado e reconhecimento mais lento em telas pequenas. | Medir em 320/360/390 px; testar cinco destinos com acesso adicional apenas se a observação justificar. Não presumir overflow sem medição. |
| P2 | No Desafio, a grade de 200 números precede o formulário quando as colunas se empilham; clicar só atualiza o campo. | A confirmação pode ficar distante da seleção e parecer que o toque não fez efeito. | Exibir seleção e próximo passo próximos; considerar levar ao formulário após escolha, preservando foco e retorno à grade. |
| P2 | Início dedica o primeiro bloco à cena e à meta antes do resumo financeiro. | A consulta diária do saldo pode exigir rolagem adicional. | Testar resumo e ação principal antes da cena, mantendo a identidade visual; medir se o casal encontra o saldo sem ajuda. |
| P3 | Fotos usam “Preparando sua foto…” tanto no processamento quanto ao salvar/remover. | Estado pouco preciso durante a espera. | Diferenciar “Preparando”, “Salvando” e “Removendo”; manter confirmação de conclusão. |
| P3 | A revisão semanal fica em Mascotes e o botão Comprar fica desabilitado com moedas insuficientes. | A pessoa pode não descobrir como ganhar moedas nem entender a indisponibilidade. | Oferecer ligação contextual no Planejamento e motivo visível junto da peça, sem interromper o fluxo financeiro. |

## Acessibilidade aplicada à revisão

Context7 foi consultado para `/radix-ui/primitives`, sobre nomes acessíveis, diálogos, foco e teclado. A documentação do Radix explica que rótulos, navegação por teclado e gestão de foco fazem parte do comportamento esperado dos controles. Esses princípios orientam os aceites; a aplicação usa majoritariamente controles HTML nativos e não recebe automaticamente as garantias de todos os componentes Radix apenas por depender de Slot. [Referência Radix](https://www.radix-ui.com/primitives/docs/overview/accessibility).

Se as confirmações atuais forem substituídas por diálogos personalizados, testar nome e descrição acessíveis, foco inicial, contenção de foco quando modal, Escape e retorno ao acionador. A consulta Context7 mostrou esses comportamentos na implementação de Dialog. A confirmação de compra atual é um trecho inline; não é avaliada como modal nem precisa prender o foco.

Para alvos de toque, WCAG 2.2 estabelece 24 × 24 CSS px como mínimo, com exceções por espaçamento e controles equivalentes. Tamanho de fonte sozinho não comprova falha nesse critério. Como objetivo de conforto, buscar áreas de toque maiores nas ações frequentes e medir a grade, barra inferior e botões pequenos no navegador. [Critério e exceções do W3C](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

## Observação durante o uso

Fazer tarefas curtas sem explicar o caminho de antemão. Usar dados reais somente quando a pessoa já pretende registrá-los; evitar lançamentos fictícios no ambiente pessoal.

| Tarefa | Observar |
| --- | --- |
| Encontrar o dinheiro disponível hoje | Consegue diferenciar saldo livre, saldo total e diferença estimada? |
| Registrar uma despesa já paga | Encontra Registrar, identifica a conta e percebe a confirmação? |
| Ajustar uma estimativa própria | Entende que isso não registra pagamento e identifica a linha salva? |
| Reservar um número | Entende o valor e que a reserva não transfere dinheiro ao banco? |
| Trocar foto | Distingue prévia de foto salva e encontra cancelar? |
| Encontrar e vestir uma roupa | Entende moedas virtuais, compra e vestir como etapas distintas? |

Modelo para cada observação:

| Data | Tela e dispositivo | O que tentou fazer | Onde hesitou ou errou | O que esperava | Resultado |
| --- | --- | --- | --- | --- | --- |
| 30/10/2026 | Acesso e fotos; dispositivo não informado | Entrar nas duas contas e usar fotos | Nenhum problema relatado | Acesso e fotos funcionais | Funcionamento confirmado pelo usuário |

Não guardar e-mails, senhas, saldos ou capturas com informações pessoais neste relatório versionável. Uma ação concluída com ajuda deve ser registrada como tal. Depois das primeiras observações, priorizar dúvidas recorrentes e verificar se os ajustes reduziram a necessidade de explicação.

## Sequência sugerida

1. Corrigir selo do Perfil, destino de Registrar e prevenção de retirada acidental.
2. Aproximar feedback dos formulários e simplificar os textos técnicos.
3. Validar leitura e toque em celular, zoom e percurso de teclado; medir contraste.
4. Observar a rotina do casal antes de reorganizar a navegação ou o Início.

Recuperação externa de senha, exportação/backup e saída/retenção permanecem pendências do produto que afetam confiança e autonomia. A confirmação de login e fotos não encerra essas pendências. Os achados acima registram o diagnóstico inicial; a execução abaixo identifica o que já mudou.


## Execução do primeiro incremento

Em 30/10/2026, após autorização do usuário, implementados:

- Ícones distintos: carteira para Finanças e calendário para Planejamento, na lateral e no celular.
- Selo de conta conectada no Perfil autenticado e destino `#novo` no formulário financeiro.
- Confirmação nativa antes de retirar estimativa, com nome, efeito nos totais e preservação de histórico. Cancelar mantém o item; falhas liberam nova tentativa.
- Rótulos visíveis nos campos existentes e retorno de salvamento/erro junto ao item. Após retirada, confirmação fica na seção da própria pessoa.
- Mensagem de credencial recusada sem “Auth” ou “conta local”; o destino após login permanece Minha conta.
- “Confirmar reserva” no Desafio, com explicação do efeito. Selecionar um número leva o foco ao formulário; “Voltar aos números” retorna à seleção.
- Textos de apoio maiores e mais escuros, botões de planejamento/histórico com altura mínima de 44 px e barra inferior com seis colunas. O rótulo visual “Planejar” mantém “Planejamento” como nome acessível.
- Estados distintos de preparar, salvar e remover foto; indicação de moedas faltantes junto às peças; link da revisão semanal a partir do Planejamento.

As quatro combinações ajustadas de texto/fundo tiveram contraste calculado entre 5,77:1 e 6,63:1. Isso cobre essas combinações, não uma auditoria integral de cores ou estados.

A ordem dos blocos do Início e os seis destinos de navegação foram preservados enquanto o casal observa o uso. Recuperação externa, portabilidade e vínculo automático de deploy continuam fora deste incremento.

Validação: TypeScript, ESLint, 44 testes Vitest, teste Node de deploy e build de produção passaram. Dez E2E da demonstração passaram. `node tests/ux-smoke.mjs` validou uma conta sintética local: cancelamento/retirada/persistência de estimativa, salvamento e erro junto ao item, destino Registrar e percurso de teclado, foco de confirmação/retorno no Desafio, ícones distintos e seis rotas em 320/360/390/1280 px sem transbordamento ou erros JavaScript. Planejamento também passou em viewport de 640 px. Captura sintética revisada visualmente; fixtures removidas ao finalizar.

O ensaio com `zoom: 2` por CSS apresentou transbordamento; esse mecanismo não reproduz o zoom nativo e foi substituído no teste por medição explícita de reflow a 640 px. Zoom nativo de 200%, leitor de tela e celular físico continuam sem validação nesta rodada. Não houve publicação destas alterações nesta tarefa.
