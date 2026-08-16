# Monitor de Preços — Status Atual

## Visão Geral

Sistema de monitoramento de preços que consulta uma loja fake e compara com o histórico registrado no banco local, produto a produto.

## Modelo de Dados (atual)

- Tabela de **produtos** cadastrada no banco.
- Cada produto tem um **ID** que serve de chave de consulta na loja fake.
- Cada produto está vinculado a **uma única loja** (1:1).

> Limitação conhecida: modelo hoje é `produto -> 1 loja`. Precisa evoluir para `produto -> N lojas` (1:N) para suportar comparação de preço entre fornecedores diferentes do mesmo produto.

## Fluxo Atual (happy path)

1. Sistema lê produto cadastrado no banco.
2. Consulta a loja fake usando o ID do produto.
3. Loja fake retorna o produto (preço incluso).
4. Sistema verifica se já existe registro de preço para esse produto:
   - **Não existe** → insere o preço atual como primeiro registro.
   - **Existe** → compara com o último preço registrado:
     - **Mudou** → *(comportamento ainda não definido — ver pendências)*
     - **Não mudou** → mantém o registro como está, sem nova escrita.

## Pendências (ordem não definida, para priorizar depois)

- [ ] **Multi-loja por produto**: alterar modelo de dados para `produto -> N lojas`. Impacta schema, query de consulta e lógica de comparação (qual preço vira "o" preço do produto quando há várias lojas?).
- [ ] **Tratamento de erro**: nenhum error handling implementado ainda. Pontos de falha não cobertos:
  - Loja fake fora do ar / timeout.
  - Produto não encontrado na loja fake (ID inválido ou descontinuado).
  - Falha de escrita no banco.
- [ ] **Ação quando o preço muda**: hoje não há decisão tomada sobre o que fazer nesse caso (só registrar histórico? disparar alerta? ambos?).

## Fora de escopo por enquanto

Nada definido — este documento serve de ponto de partida para as próximas decisões de arquitetura do projeto.