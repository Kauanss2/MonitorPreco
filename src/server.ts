import express from "express";
import mysql from 'mysql2/promise';
import { query } from "./pg";



const app = express();

app.use(express.json());

type Produto = {
  id: number;
  nome: string;
  Url: string;
};

type ProdutoPreco = Produto & {
  preco:number;
  precoAtualizado?: number;
}


app.get("/produto", async (req, res) => {

  try {




    const produtos = await query('SELECT * FROM produtos') as Produto[];

    const produtosComPreco: ProdutoPreco[] = [];


    for  (const produto of produtos) {
      console.log(`Buscando preço do produto: ${produto.nome} - ID: ${produto.id}`);
        const resposta = await fetch(produto.Url, {
            signal: AbortSignal.timeout(5000)
        });
        const data = await resposta.json();

   const preco = await query(
  'SELECT * FROM precos WHERE preco_centavos = ? AND product_id = ?',
  [data.preco, produto.id]
) as Array<{ id: number; product_id: number; preco_centavos: number; status: string }>;       

console.log(preco)
console.log(`Preço encontrado: ${preco.length}, Alem disso ID encontrado ${produto.id}` )

  if (preco.length === 0){
    console.log("Produto não encontrado, inserindo novo preço")
    console.log(produto.id)
   const precoAtualizado = await query(
  'INSERT INTO precos (product_id, preco_centavos, status) VALUES (?, ?, ?)',
  [produto.id, data.preco, 'SUCESSO']

)

  }

   produtosComPreco.push({
    ...produto,
    preco: data.preco,
  });
    }


    return res.json(produtosComPreco);


  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Ocorreu um erro ao buscar o produto." });
  }
});






app.listen(3333, () => {
  console.log("Servidor rodando na porta 3000");
});