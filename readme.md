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

## Migration Atual 

1- Atualmente Temos a migration que funciona da seguinte forma voce deve criar a migration manual com o name sql, apos isso vc roda npm run migrate que vai verificar foi utilizado a biblioteca fs para realizar a leitura dos arquivos e adicionar no banco migrations, dessa forma temos todo o historia caso  exista o arquivo e náo exista no banco ele adiciona automaticamente creio que seja necessario criarmos algumas validacao do que temos no banco e nao temos migration so que ho nao temos seria interessante pegar um branco pronto e criar a migration automatico nao sei se vamos chegar nesse nivel 


## STATUS CODE

200	OK	GET realizado com sucesso
201	Created	POST criou um recurso
400	Bad Request	Dados enviados pelo cliente são inválidos
404	Not Found	Produto/rota/recurso não encontrado
500	Internal Server /  Erro inesperado no servidor - Mensagem generica sempre
409 Conflict — produto duplicado. O dado é válido, o conflito é com o estado atual. É a diferença pro 400, onde o dado é que está errado.
502 Bad Gateway — a loja externa falhou. É 5xx porque a culpa não é do cliente, e sinaliza que retry pode resolver.

## LENTIDAO

A query do histórico levava ~1s medido pelo cliente SQL. O EXPLAIN ANALYZE mostrou 6ms de execução real — o 1 segundo era transferência de 3.768 linhas e renderização no DBeaver, não o banco.

Lição: cronômetro do cliente mede banco + rede + renderização. Pra medir o banco, use EXPLAIN ANALYZE.

O EXPLAIN mostrou ainda que o índice lia 5.000 linhas e descartava 1.232 no filtro de data. Criado índice composto (id_produto_link, atualizado_em) — coluna de igualdade primeiro, faixa depois. Linhas lidas passaram a ser iguais às devolvidas e o Filter sumiu do plano.

E 3,5x do ganho total veio de corrigir um <= que deveria ser >=: 6,09ms → 1,7ms. Query errada otimizada continua errada.
## TRATAMENTO DE ERRO

1 -  ao utilziar o error.ts foi utilizado a classe para que possamos utilizar exatamente algo ja existente sem reiventar a roda novamente

## ORGANIZACAO DOS ARQUIVOS

1- No entanto tudo se concentra em server.js tirando as migrations isso náo é o nelhor caminho mas no entanto estamos sentindo a dor para mudar no futuro 

## APIS 

1- Hoje a maioria e feito em sql e poucas coisas sao feito em sql no entanto acho melhor deixar o sql entregar melhor do que deixar o js realizar as validao dessa forma conseguimos fazer somente consultas necessaria sem necessidade de ter que realizar diversas consultar Alem disso temos o ganho de evitar n:1 entre outros termos tecnicos como round-trip


## DOCKER

Foi decidido usar Docker para  aprender mais uma ferramenta e entender a dor que ela mata na pratica literalmente sem ser por tutorial ou youtube sentir na pele ensina mais do que qualquer coisa e isso mata nosso processo de em um computador funcionar e em outro náo



## Fora de escopo por enquanto

Nada definido — este documento serve de ponto de partida para as próximas decisões de arquitetura do projeto.


## DeadLock E Isolamento Repeatable Read

Deadlock (provocado no dia 20). Duas transações, cada uma travando um registro e pedindo o outro — ordem invertida. O MySQL detecta o ciclo e mata uma das duas com erro 1213, escolhendo como vítima a que fez menos trabalho. A mensagem do próprio banco sugere "try restarting transaction": deadlock não é bug, é evento esperado, e a aplicação deveria tratar com retry.

Antes disso tomei o erro 1205 (lock wait timeout), que é diferente: só uma transação esperando, sem ciclo, desistindo após 50s.

Analisado com SHOW ENGINE INNODB STATUS, seção LATEST DETECTED DEADLOCK — mostra o que cada transação segurava e o que pedia.

O Isolamento se trata exatamente das transaction com os commit, Antes  do commit cada uma consegue enchergar de uma forma apos commitado caso a outra ainda esteja dentro da transaction vai ver o dado antigo.


## COMO RODAR 

Para rodar devemos utilizar Docker compose up + migrate + seed. e apos isso podemos utilizarn normalmente
