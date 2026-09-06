CREATE TABLE
    IF NOT EXISTS produto (
        id INT AUTO_INCREMENT PRIMARY KEY,
        Nome VARCHAR(100),
        Categoria VARCHAR(100),
        Marca VARCHAR(100),
        Modelo VARCHAR(100),
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )