CREATE TABLE
    IF NOT EXISTS Usuario (
        id int AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(200),
        email VARCHAR(200),
        senha_Hash VARCHAR(250),
        status int,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )