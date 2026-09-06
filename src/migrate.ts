import fs from "fs";
import { query } from "./pg";

type Migration = {
    nome: string;
};

export async function Migrate() {

    await query(`
        CREATE TABLE IF NOT EXISTS migrations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nome VARCHAR(255) NOT NULL UNIQUE,
            executado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `);

    const arquivos = fs.readdirSync("./src/migrations").sort()
    console.log(arquivos)

    const migrations = await query(
        `SELECT nome FROM migrations`
    ) as Migration[];

    const pendentes = arquivos.filter(arquivo => {
        return !migrations.some(
            migration => migration.nome === arquivo
        );
    });

    // ...
    for (const arquivo of pendentes) {
        console.log(arquivo);
        const sql = await fs.promises.readFile(`./src/migrations/${arquivo}`, "utf-8");
        await query(sql)
        await query('INSERT INTO migrations (nome) VALUES (?)', [arquivo])
    }

    // MELHORIA FUTURA CASO O SQL RODE A PRIMEIRA PARTE E PARE A SEGUNDA NÃO É
    //  RETREATADO NEHUM ERRO NEM ROLLBACK NÃO TENHO CERTEZA MAS CREIO QUE O 
    // CERTO SEJA ROLLBACK

}
try {
    Migrate();
} catch (err) {
    console.error(err)
}