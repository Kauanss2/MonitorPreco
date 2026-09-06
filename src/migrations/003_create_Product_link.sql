CREATE TABLE
    IF NOT EXISTS produto_link (
        ID int AUTO_INCREMENT PRIMARY KEY,
        id_produto int,
        FOREIGN KEY (id_produto) REFERENCES produto (id) ON DELETE CASCADE,
        Link VARCHAR(200)
    )