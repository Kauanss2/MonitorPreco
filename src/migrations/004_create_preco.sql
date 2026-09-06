CREATE TABLE
    IF NOT EXISTS preco (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_produto_link INT,
        FOREIGN KEY (id_produto_link) REFERENCES produto_link (id) ON DELETE CASCADE,
        preco_centavos INT,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50),
        erro_detalhe TEXT
    );