CREATE TABLE
    IF NOT EXISTS alertas (
        id int AUTO_INCREMENT PRIMARY KEY,
        Id_Produto INT,
        usuario_id INT,
        FOREIGN KEY (usuario_id) REFERENCES usuario (id),
        precoAlvo float
    )