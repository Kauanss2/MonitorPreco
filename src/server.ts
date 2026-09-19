import express from "express";
import { query } from "./mysql";



const app = express();

app.use(express.json());

type Produto = {
  id: number;
  nome: string;
  Url: string;
};

type ProdutoPreco = Produto & {
  preco: number;
  precoAtualizado?: number;
}

type ProdutoUsuario = {
  id: number;
  nome: string
  categoria: string
  marca: string
  modelo: string
  alerta_id: number
  usuario_id: number
  precoAlvo: number
  preco_centavos: number
  atualizado_em: Date

}

const myId = 26
const idProcuct = 26


app.get("/produto", async (req, res) => {
  // TODO: rota no schema antigo (precos/product_id). Migrar para preco/id_produto_link.
  try {

    const produtos = await query('SELECT * FROM produto') as Produto[];

    const produtosComPreco: ProdutoPreco[] = [];


    for (const produto of produtos) {
      console.log(`Buscando preço do produto: ${produto.nome} - ID: ${produto.id}`);
      const resposta = await fetch(produto.Url, {
        signal: AbortSignal.timeout(5000)
      });
      const data = await resposta.json();

      const preco = await query(
        'SELECT * FROM preco WHERE preco_centavos = ? AND id_produto_link = ?',
        [data.preco, produto.id]
      ) as Array<{ id: number; id_produto_link: number; preco_centavos: number; status: string }>;

      console.log(preco)
      console.log(`Preço encontrado: ${preco.length}, Alem disso ID encontrado ${produto.id}`)

      if (preco.length === 0) {
        console.log("Produto não encontrado, inserindo novo preço")
        console.log(produto.id)
        const precoAtualizado = await query(
          'INSERT INTO preco (id_produto_link, preco_centavos, status) VALUES (?, ?, ?)',
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

app.get("/myproduct", async (req, res) => {


  try {
    const produtos = await BuscarProduct(26)

    if (produtos.length === 0) {
      return res.json({ Message: "Produto náo encontrado" })
    }

    const maisBarato = produtos.reduce((acumulador, atual) => {

      return atual.preco_centavos < acumulador.preco_centavos ? atual : acumulador;

    })


    return res.json(maisBarato);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Ocorreu um erro ao buscar o produto." });
  }


})

app.get("/health", async (req, res) => {
  res.json({
    sucess: "Healt"
  })
})

app.post("/produto", async (req, res) => {

  try {
    const { Nome, Categoria, Marca, Modelo } = req.body
    if (!Nome?.trim() || !Categoria?.trim() || !Marca?.trim() || !Modelo?.trim()) {
      return res.status(400).json({
        Message: "Gentilizar Enviar todos os campos"
      })

    }

    const newProduct = await query(`INSERT INTO produto (Nome,Categoria,Marca,Modelo)  VALUES(?,?,?,?)`, [Nome, Categoria, Marca, Modelo])
    const id = (newProduct as any).insertId;
    const selectProduct = await query(`SELECT * FROM produto WHERE id = ?`, [id])
    console.log(selectProduct)

    // Deveria ser CHAVE UNICA MINHA COMBINA;AO DE NOME CATEGORIA MARCA E MODELO MINHA OPNIAO 
    res.status(201).json({ sucess: selectProduct })

  } catch (errr) {
    console.error(errr)
    res.status(500).json({ errr: "Contate um Administrador" })


  }
})

async function BuscarProduct(productId: number): Promise<ProdutoUsuario[]> {
  // ALTERAR USUARIO E PRODUCT ID CHUMBADO
  const produto = await query(`  SELECT
    p.id,
    p.nome,
    p.categoria,
    p.marca,
    p.modelo,
    a.Id AS alerta_id,
    a.usuario_id,
    a.precoAlvo,
    preco.preco_centavos,
    preco.atualizado_em
FROM produto p
  INNER JOIN alertas a
    ON p.id = a.Id_Produto
    INNER JOIN produto_link  ON  p.id = produto_link.id_produto
    INNER JOIN preco ON produto_link.id = preco.id_produto_link
    
WHERE preco.atualizado_em = (
  SELECT MAX(p2.atualizado_em)
  FROM preco p2
  WHERE p2.id_produto_link = produto_link.id
  ) 
 AND usuario_id = ?
 AND p.id = ?`, [myId, productId]) as ProdutoUsuario[]

  return produto
}




app.listen(3333, () => {
  console.log("Servidor rodando na porta 3333 ");
});