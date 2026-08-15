# Monitor de Preços — Plano diário (45 min)
### Dias 1 a 28 — Bloco Fundação

---

## Regras do jogo

1. **45 minutos com timer.** Acabou o timer, acabou o dia — mesmo no meio de algo. Se estiver empolgado e quiser continuar, continue; mas o compromisso é 45. Compromisso que você cumpre vale mais que compromisso ambicioso que você quebra.
2. **Um dia = uma entrega.** Se não terminou, terminou mesmo assim. Empurra o resto para o dia seguinte e segue.
3. **Todo dia 7 é folga ou recuperação.** Já está no plano. Atrasar não é falha, é o buffer sendo usado.
4. **Numerado por dia, não por data.** Pulou terça? Terça vira dia 12 no lugar de ficar "atrasado na semana 3". Não existe atraso, existe só o próximo dia.
5. **Commit todo dia.** Mesmo que seja uma linha. O histórico do Git é a prova de que você apareceu.

> Ritmo real: 45 min × 6 dias ≈ 4,5h/semana. É menos que as 8h do plano original — então o bloco Fundação leva ~4 semanas em vez das 3 que levaria. Tudo bem. Consistência ganha de intensidade.

---

# Semana 1 — Fazer existir

O objetivo desta semana não é aprender nada. É o projeto sair do zero.

**Dia 1 — Nascimento**
Pasta, `npm init`, TypeScript configurado, `git init`, primeiro commit, repositório no GitHub.
✅ Um `console.log("oi")` rodando com `npm run dev`.

**Dia 2 — Banco de pé**
`docker-compose.yml` com Postgres. Sobe, conecta com um cliente (DBeaver, psql, o que preferir).
✅ `docker compose up` e o banco responde.

**Dia 3 — A loja falsa**
Um segundo servidorzinho, separado, com um endpoint `GET /produto/:id` que devolve `{ "preco": 149.90 }` com valor aleatório.
✅ Você abre no navegador e vê o JSON.

**Dia 4 — Primeiro contato**
Um script no projeto principal que chama a loja falsa e imprime o preço no console.
✅ `npm run coletar` imprime um preço.

**Dia 5 — Primeira tabela**
Tabela `produtos` (id, nome, url, criado_em). Insere dois registros na mão pelo cliente SQL.
✅ `SELECT * FROM produtos` devolve linhas.

**Dia 6 — Fechando o circuito**
O script agora lê os produtos do banco, chama a loja falsa para cada um e grava o preço numa tabela `precos`.
✅ Roda duas vezes e você vê dois preços gravados por produto.

**Dia 7 — Folga ou recuperação**
Se está em dia: escreve 5 linhas no README dizendo o que o projeto faz. Push.

> No fim da semana 1 você tem um sistema que coleta preço e guarda histórico. É pouco código e é mais do que 90% dos projetos que nunca saíram do planejamento.

---

# Semana 2 — Banco de verdade

**Dia 8 — Modelar no papel**
Sem código. Desenhe as tabelas: `usuarios`, `produtos`, `precos`, `alertas`. Quais campos, quais chaves, o que se relaciona com o quê.
✅ Um desenho (papel, Excalidraw, o que for) commitado como imagem ou texto.

**Dia 9 — Migrations**
Escolha uma ferramenta de migration e recrie o schema por ela. Nada de tabela criada na mão daqui pra frente.
✅ `npm run migrate` monta o banco do zero.

**Dia 10 — Massa de dados**
Script que gera ~500 mil linhas em `precos` (datas espalhadas no último ano).
✅ `SELECT count(*) FROM precos` devolve algo grande.

**Dia 11 — A query lenta**
Escreva "histórico dos últimos 90 dias do produto X". Meça o tempo.
✅ Você tem um número em ms anotado.

**Dia 12 — Ler o plano**
`EXPLAIN ANALYZE` na query. Não decore: entenda o que é Seq Scan, o que é Index Scan, e onde está o custo.
✅ Você consegue dizer em uma frase por que está lenta.

**Dia 13 — O índice**
Crie o índice certo. Rode `EXPLAIN` de novo. Meça de novo.
✅ Antes e depois anotados no README.

**Dia 14 — Folga ou recuperação**
Em dia? Escreve no README: "por que essa query era lenta e o que o índice mudou".

---

# Semana 3 — Transação, N+1, deadlock

**Dia 15 — Estudo dirigido**
Leitura sobre transação e ACID. 45 min de leitura, com 3 anotações no fim. Sem código.
✅ Três frases suas explicando atomicidade, consistência e isolamento.

**Dia 16 — A query ingênua**
Endpoint (ou função) "meus produtos com o preço atual de cada um" — escrito do jeito óbvio, um loop chamando o banco por produto.
✅ Funciona e devolve a lista.

**Dia 17 — Ver o crime**
Ligue o log de queries do Postgres. Rode o dia 16. Conte quantas queries saíram.
✅ Você viu N+1 acontecendo com seus olhos.

**Dia 18 — Consertar**
Reescreva com uma query só (join ou lateral).
✅ Uma query no log, mesmo resultado.

**Dia 19 — Isolamento**
Leitura: Read Committed vs Repeatable Read vs Serializable. Abra duas sessões `psql` e teste na prática o que cada uma enxerga.
✅ Você viu com os próprios olhos uma sessão não ver o que a outra escreveu.

**Dia 20 — Provocar deadlock**
Duas transações, em duas sessões, pegando os mesmos dois registros em ordem invertida.
✅ O Postgres cospe um erro de deadlock. Comemore — foi de propósito.

**Dia 21 — Folga ou recuperação**
Em dia? Anota no README como evitar aquele deadlock.

---

# Semana 4 — Virar serviço

**Dia 22 — Servidor no ar**
Fastify (ou NestJS) rodando, com `GET /health`.
✅ Responde no navegador.

**Dia 23 — Cadastrar produto**
`POST /produtos` com validação de entrada de verdade (Zod ou equivalente).
✅ Manda payload inválido e recebe erro claro, não stack trace.

**Dia 24 — Listar**
`GET /produtos` devolvendo a lista com preço atual — reaproveitando a query boa do dia 18.
✅ Uma requisição, uma query.

**Dia 25 — Erro com intenção**
Handler central de erro. Defina o que devolve em: validação, não encontrado, conflito, falha da loja externa, erro inesperado.
✅ Cinco cenários, cinco status codes, cada um justificado no README.

**Dia 26 — Histórico**
`GET /produtos/:id/historico?dias=90`.
✅ Devolve os dados que alimentariam o gráfico.

**Dia 27 — Tudo num comando**
Docker Compose subindo app + banco + loja falsa junto.
✅ `docker compose up` e o sistema inteiro roda.

**Dia 28 — Consolidar**
README decente: o que é, como roda, e as decisões que você tomou até aqui.
✅ Push. Alguém consegue clonar e rodar sem te perguntar nada.

---

## Onde você está no dia 28

Um serviço que coleta preços, guarda histórico, expõe API com validação e tratamento de erro, com schema versionado e índice justificado por medição.

Ainda não tem: fila, cache, auth, alerta, teste, deploy. Isso é do dia 29 em diante — e a gente monta quando você chegar lá, não agora.

---

## Se falhar dois dias seguidos

Não replaneje. Não recomece. Abre o projeto e faz **15 minutos**. Voltar a aparecer importa mais que cumprir o dia certo.