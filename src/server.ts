import express, { NextFunction, Response, Request } from "express";
import { query } from "./mysql";
import { errorMiddleware } from "./error";
import { ApiError, NotFoundError } from "./apiErrors";



const app = express();

app.use(express.json());

type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>

const asyncHandler = (fn: AsyncRouteHandler) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next)




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
  id: number
  nome: string
  categoria: string
  marca: string
  modelo: string
  alerta_id?: number
  usuario_id?: number
  precoAlvo?: number
  preco_centavos: number
  atualizado_em: Date

}



const myId = 26
const idProcuct = 26


app.post("/coletar", asyncHandler(async (req, res) => {
  // TODO: rota no schema antigo (precos/product_id). Migrar para preco/id_produto_link.

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



}));

app.get("/produtos", asyncHandler(async (req, res) => {

  const produtos = await query(`SELECT 
produto.id,
produto.Nome, 
produto.Categoria,
produto.Marca,
produto.Modelo,
preco.preco_centavos,
produto.criado_em,
preco.atualizado_em 
FROM produto INNER JOIN produto_link p ON p.id_produto = produto.id 
inner join preco on preco.id_produto_link  = p.ID
where preco.atualizado_em  = (
  SELECT MAX(p2.atualizado_em) 
  from preco p2
  WHERE p2.id_produto_link = p.id
)
  
`) as ProdutoUsuario[]


  const produtoss = menorPrecoPorProduto(produtos)

  res.status(200).json({ Sucess: produtoss });
}));



function menorPrecoPorProduto(linhas: Array<ProdutoUsuario>) {

  const mapa = new Map<number, ProdutoUsuario>

  for (const linha of linhas) {

    if (linha.preco_centavos == null) {
      continue
    }

    const campeao = mapa.get(linha.id)


    if (!campeao || linha.preco_centavos < campeao.preco_centavos) {
      mapa.set(linha.id, linha)
    }
  }

  return [...mapa.values()]





}

app.get("/produtos/:id/historico", asyncHandler(async (req, res) => {




  const dias = Number(req.query.dias)
  const id = Number(req.params.id)

  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError('id do produto inválido', 400)
  }
  if (!Number.isInteger(dias) || dias <= 0 || dias > 365) {
    throw new ApiError('dias deve ser um inteiro entre 1 e 365', 400)
  }


  const produtos = await query(`SELECT 
produto.id,
produto.Nome, 
produto.Categoria,
produto.Marca,
produto.Modelo,
preco.preco_centavos,
produto.criado_em,
preco.atualizado_em 
FROM produto INNER JOIN produto_link p ON p.id_produto = produto.id 
inner join preco on preco.id_produto_link  = p.ID
WHERE preco.atualizado_em >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
AND produto.id = ?

  
`, [dias, id]) as ProdutoUsuario[]

  res.status(201).json({ sucess: produtos })




}));

app.get("/myproduct", asyncHandler(async (req, res) => {



  const produtos = await BuscarProduct(26)

  if (produtos.length === 0) {
    throw new NotFoundError("Produto não encontrado")
  }

  const maisBarato = produtos.reduce((acumulador, atual) => {

    return atual.preco_centavos < acumulador.preco_centavos ? atual : acumulador;

  })


  return res.json(maisBarato);




}));


app.get("/health", asyncHandler(async (req, res) => {
  res.json({
    sucess: "Healt"
  })
}));

app.post("/produto", asyncHandler(async (req, res) => {


  const { Nome, Categoria, Marca, Modelo } = req.body
  if (!Nome?.trim() || !Categoria?.trim() || !Marca?.trim() || !Modelo?.trim()) {
    throw new ApiError('Todos os campos obrigatórios devem ser preenchidos.', 400)
  }

  const newProduct = await query(`INSERT INTO produto (Nome,Categoria,Marca,Modelo)  VALUES(?,?,?,?)`, [Nome, Categoria, Marca, Modelo])
  const id = (newProduct as any).insertId;
  const selectProduct = await query(`SELECT * FROM produto WHERE id = ?`, [id])
  console.log(selectProduct)

  // Deveria ser CHAVE UNICA MINHA COMBINA;AO DE NOME CATEGORIA MARCA E MODELO MINHA OPNIAO 
  res.status(201).json({ sucess: selectProduct })



}));

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


app.use((req, res, next) => {
  throw new NotFoundError("Pagina Inexistente")
});

app.use(errorMiddleware)

app.listen(3333, () => {
  console.log("Servidor rodando na porta 3333 ");
});