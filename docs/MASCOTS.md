# Mascotes e guarda-roupa — 30/10/2026

Cada participante escolhe gato ou cachorro, independentemente do parceiro, em `/mascotes`. A espécie e as peças vestidas são lidas do banco também na tela inicial. A descrição acessível identifica o dono real; não associa uma espécie a uma pessoa fixa.

Uma revisão autodeclarada do planejamento rende **5 moedas virtuais e 20 XP**, uma vez por semana (segunda a domingo, America/Sao_Paulo). É necessário vínculo ativo e ao menos uma estimativa ativa no espaço. A interface convida a abrir o planejamento e exige confirmar que a revisão aconteceu; o aplicativo não verifica a qualidade dessa revisão. Nível exibido: `floor(XP / 100) + 1`.

Catálogo inicial: Suéter jardim e Suéter abraço (5 moedas cada), Jardineira dos sonhos (10), Chapéu de passeio (5) e Chapéu de celebração (10). Compras exigem confirmação; vestir e guardar não custam moedas. Uma roupa e um chapéu por vez, compatíveis com ambas as espécies. Trocar espécie preserva carteira, XP, inventário e equipamento.

Não há dinheiro real, venda de moedas, saque, transferência, sorteio, punição por pausa, prêmio por volume financeiro ou sequência obrigatória. Não há equipamento com efeito financeiro, inventário negociável, conquista adicional ou missão automática neste incremento. O esboço `src/domain/rewards.ts` continua isolado e não distribui prêmios; a regra efetiva desta entrega vive na RPC SQL.

## Persistência e autorização

Migração `202610300001_mascot_wardrobe.sql`: catálogo `mascot_items`, carteira `mascot_wallets`, propriedade/equipamento `mascot_inventory` e origens canônicas semanais `mascot_reviews`. São separados dos saldos financeiros e da tabela futura `reward_events`.

O cliente possui apenas SELECT sob RLS. Carteira e inventário são visíveis ao dono/parceiro ativo; revisões são privadas do dono. As RPCs não recebem um usuário: derivam `auth.uid()`, verificam vínculo ativo e bloqueiam a carteira com `FOR UPDATE`. A chave `(user_id, week_start)` deduplica revisão; `(user_id, item_id)` deduplica compra. Pedidos simultâneos são serializados para impedir saldo negativo e equipamento duplicado por slot. Não é permitido equipar uma peça que não pertence ao usuário. Todos os writes da economia passam pelas RPCs; as funções SECURITY DEFINER têm search_path vazio, nomes qualificados e execução revogada de public/anon.

Referências consultadas no Context7: [funções de banco Supabase](https://supabase.com/docs/guides/database/functions), [importação de usuários preservando hashes](https://supabase.com/docs/guides/platform/migrating-to-supabase/auth0). O Context7 forneceu orientação técnica; a regra motivacional semanal é uma decisão de produto deste incremento.

## Verificação

- `supabase/tests/mascot_wardrobe.sql`: fixtures sintéticas e rollback; revisão única, saldo insuficiente, compra repetida, propriedade, slots, troca de espécie, RLS, parceiro, estranho, revogação e anônimo.
- `node tests/mascot-smoke.mjs`: somente Supabase local; cria/remove fixtures, disputa oito revisões e oito compras, disputa duas peças por um único saldo, testa seletor/equipamento/reload/dashboard e largura de 320 px.
- `tests/production-access-smoke.mjs`: lê configuração privada pelo stdin, cria sessões temporárias sem enviar e-mail, verifica as duas contas, planejamento e rotas publicadas sem gravar dados financeiros ou recompensas. Encerra somente suas próprias sessões de teste. Não substitui o login manual por senha nem a validação de recuperação por e-mail.
