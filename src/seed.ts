import { query } from "./pg";

// ============================================================
// AJUSTE OS NOMES DE COLUNA se não baterem com suas migrations.
// ============================================================

const QTD_PRODUTOS = 50;
const LINKS_POR_PRODUTO = 2;      // 100 produto_link no total
const COLETAS_POR_LINK = 5000;    // 100 * 5000 = 500.000 linhas em precos
const TAMANHO_LOTE = 1000;

const LOJAS = ["amazon", "mercadolivre", "kabum", "magalu"];
const CATEGORIAS = ["Periférico", "Monitor", "Armazenamento", "Áudio", "Rede"];
const MARCAS = ["Logitech", "Redragon", "Kingston", "Samsung", "HyperX", "TP-Link"];

const aleatorio = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

async function seed() {
    console.time("seed");

    // ---------- limpa (ordem inversa da dependência) ----------
    await query("DELETE FROM alertas");
    await query("DELETE FROM preco");
    await query("DELETE FROM produto_link");
    await query("DELETE FROM produto");
    await query("DELETE FROM usuario");

    // ---------- usuarios ----------
    const usuarioIds: number[] = [];
    for (let i = 1; i <= 5; i++) {
        const r: any = await query(
            "INSERT INTO usuario (nome, email, senha_hash, status) VALUES (?, ?, ?, ?)",
            [`Usuario ${i}`, `usuario${i}@teste.com`, "hash_falso_nao_usar", "1"]
        );
        usuarioIds.push(r.insertId);
    }
    console.log(`usuarios: ${usuarioIds.length}`);

    // ---------- produtos + links ----------
    // Guardo o id do link E um preço-base por link. O preço-base é o ponto
    // de partida da série temporal: sem ele os preços virariam ruído puro.
    const links: { id: number; precoBase: number }[] = [];

    for (let p = 1; p <= QTD_PRODUTOS; p++) {
        const r: any = await query(
            "INSERT INTO produto (nome, categoria, marca, modelo) VALUES (?, ?, ?, ?)",
            [
                `Produto ${p}`,
                CATEGORIAS[aleatorio(0, CATEGORIAS.length - 1)],
                MARCAS[aleatorio(0, MARCAS.length - 1)],
                `MOD-${aleatorio(1000, 9999)}`,
            ]
        );
        const produtoId = r.insertId;
        const precoBase = aleatorio(5000, 300000); // R$50 a R$3000, em centavos

        for (let l = 0; l < LINKS_POR_PRODUTO; l++) {
            const loja = LOJAS[aleatorio(0, LOJAS.length - 1)];
            const rl: any = await query(
                "INSERT INTO produto_link (id_produto, link) VALUES (?, ?)",
                [produtoId, `https://${loja}.com.br/produto/${produtoId}-${l}`]
            );
            // pequena variação de preço entre lojas: ±10%
            links.push({
                id: rl.insertId,
                precoBase: Math.round(precoBase * (0.9 + Math.random() * 0.2)),
            });
        }
    }
    console.log(`produtos: ${QTD_PRODUTOS} | links: ${links.length}`);

    // ---------- precos ----------
    // Random walk: cada coleta varia até ±1,5% da anterior, com teto e piso
    // em torno do preço-base. Isso gera uma série que sobe e desce como preço
    // de verdade — importante porque o alerta de queda depende disso.
    const agora = Date.now();
    const UM_ANO_MS = 365 * 24 * 60 * 60 * 1000;
    const intervalo = UM_ANO_MS / COLETAS_POR_LINK;

    let lote: any[][] = [];
    let total = 0;

    for (const link of links) {
        let preco = link.precoBase;

        for (let i = 0; i < COLETAS_POR_LINK; i++) {
            const variacao = 1 + (Math.random() - 0.5) * 0.03;
            preco = Math.round(preco * variacao);
            preco = Math.max(Math.round(link.precoBase * 0.6), preco);
            preco = Math.min(Math.round(link.precoBase * 1.4), preco);

            const coletadoEm = new Date(agora - UM_ANO_MS + i * intervalo);

            // 2% das coletas falham — dá material pro erro_detalhe existir
            const falhou = Math.random() < 0.02;

            lote.push([
                link.id,
                falhou ? null : preco,
                coletadoEm,
                falhou ? "FALHA_REDE" : "SUCESSO",
                falhou ? "timeout ao consultar a loja" : null,
            ]);

            if (lote.length >= TAMANHO_LOTE) {
                await inserirLote(lote);
                total += lote.length;
                lote = [];
                if (total % 50000 === 0) console.log(`precos: ${total}`);
            }
        }
    }

    if (lote.length > 0) {
        await inserirLote(lote);
        total += lote.length;
    }

    console.log(`precos: ${total}`);

    // ---------- alertas ----------
    for (let i = 0; i < 20; i++) {
        await query(
            "INSERT INTO alertas (id_produto, usuario_id, precoAlvo) VALUES (?, ?, ?)",
            [aleatorio(1, QTD_PRODUTOS), usuarioIds[aleatorio(0, usuarioIds.length - 1)], aleatorio(5000, 200000)]
        );
    }

    console.timeEnd("seed");
}

// Um INSERT com N linhas em vez de N INSERTs.
// Cada query é um round-trip de rede; o ganho está em fazer 1 em vez de 1000.
async function inserirLote(lote: any[][]) {
    const placeholders = lote.map(() => "(?, ?, ?, ?, ?)").join(", ");
    const valores = lote.flat();

    await query(
        `INSERT INTO preco (id_produto_link, preco_centavos, atualizado_em, status, erro_detalhe)
     VALUES ${placeholders}`,
        valores
    );
}

seed().catch((e) => {
    console.error(e);
    process.exit(1);
});