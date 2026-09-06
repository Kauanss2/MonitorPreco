import 'dotenv/config'
import mysql from 'mysql2/promise'

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    database: 'monitor',
    password: process.env.DB_PASSWORD
})



export async function query(sql: string, values?: any[]) {
    const [results] = await pool.query(sql, values)

    return results
}