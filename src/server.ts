import express from "express";


const app = express();

app.use(express.json());

app.get("/produto/:id", async (req, res) => {

    try {
    const { id } = req.params;
    const resposta = await fetch(`http://localhost:3000/produto/${id}`, {
    signal: AbortSignal.timeout(5000) // Timeout de 5 segundos
  });
    const data = await resposta.json();
    res.json(data);
} catch (error) {
console.error(error);
res.status(500).json({ error: "Ocorreu um erro ao buscar o produto." });
}
});






app.listen(3333, () => {
  console.log("Servidor rodando na porta 3000");
});