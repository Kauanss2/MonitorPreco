import fs from "fs";
import { query } from "./mysql";

type Migration = {
    nome: string;
};

export async function Migrate() {


    try {
        await createTableMigration()

        const arquivos = await lerArquivos("./src/migrations")

        const migrations = await query(
            `SELECT nome FROM migrations`
        ) as Migration[];

        const pendentes = arquivos.filter(arquivo => {
            return !migrations.some(
                migration => migration.nome === arquivo
            );
        });

        console.log(pendentes)

        await incrementarMigration(pendentes)

        console.log({ Sucess: "Migration Incrementada" })
    }
    catch (err) {
        console.error({ error: "Error Segue" + err })
    }
    // ...

    // MELHORIA FUTURA CASO O SQL RODE A PRIMEIRA PARTE E PARE A SEGUNDA NÃO É
    //  RETREATADO NEHUM ERRO NEM ROLLBACK NÃO TENHO CERTEZA MAS CREIO QUE O 
    // CERTO SEJA ROLLBACK

}


async function lerArquivos(caminho: string): Promise<string[]> {
    const result = fs.readdirSync(caminho).sort()
    return result
}

async function incrementarMigration(pendentes: string[]) {
    for (const arquivo of pendentes) {
        const sql = await fs.promises.readFile(`./src/migrations/${arquivo}`, "utf-8");
        await query(sql)
        const result = await query('INSERT INTO migrations (nome) VALUES (?)', [arquivo])

    }


}

async function createTableMigration() {
    await query(`
        CREATE TABLE IF NOT EXISTS migrations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nome VARCHAR(255) NOT NULL UNIQUE,
            executado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

Migrate().catch((err) => {
    console.error(err)
    process.exit(1)
})