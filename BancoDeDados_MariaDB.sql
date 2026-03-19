-- versão 1.0 - Lucas Santos - 19-03-2026

DROP database IF EXISTS agenda;
CREATE DATABASE agenda;
USE agenda;

drop table if exists usuarios;
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    data_nascimento DATE NOT NULL,
    login VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    nivel_atual INT DEFAULT 1,
    experiencia_atual INT DEFAULT 0
);

drop table if exists tarefas;
CREATE TABLE tarefas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    data DATE NOT NULL,
    descricao TEXT,
    status ENUM('concluida', 'pendente', 'excluida') NOT NULL DEFAULT 'pendente',
    experiencia_bonus INT DEFAULT 0,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

drop table if exists missoes_diarias;
CREATE TABLE missoes_diarias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    data DATE NOT NULL,
    missao_1_status ENUM('pendente', 'completa') DEFAULT 'pendente',
    missao_2_status ENUM('pendente', 'completa') DEFAULT 'pendente',
    missao_3_status ENUM('pendente', 'completa') DEFAULT 'pendente',
    missao_4_status ENUM('pendente', 'completa') DEFAULT 'pendente',
    missao_5_status ENUM('pendente', 'completa') DEFAULT 'pendente',
    missao_6_status ENUM('pendente', 'completa') DEFAULT 'pendente',
    bonus_experiencia INT DEFAULT 0,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

drop table if exists experiencia;
CREATE TABLE experiencia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    tarefa_id INT,
    missao_id INT,
    experiencia_ganhar INT,
    data DATE NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (tarefa_id) REFERENCES tarefas(id) ON DELETE CASCADE,
    FOREIGN KEY (missao_id) REFERENCES missoes_diarias(id) ON DELETE CASCADE
);