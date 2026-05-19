CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cognome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    via TEXT,
    data_nascita DATE NOT NULL,
    sesso TEXT NOT NULL CHECK(sesso IN ('M', 'F', 'Altro')),
    comune TEXT NOT NULL,
    distretto TEXT NOT NULL,
    is_admin INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS impianti (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    tipo TEXT NOT NULL CHECK(tipo IN ('fotovoltaico', 'eolico', 'cogenerazione')),
    kw_installati REAL NOT NULL,
    data_installazione DATE NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS veicoli (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    tipo TEXT NOT NULL CHECK(tipo IN ('auto', 'moto', 'scooter', 'bicicletta')),
    marca TEXT,
    modello TEXT,
    capacita_batteria REAL NOT NULL,
    km_totali REAL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ricariche (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    veicolo_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    data DATE NOT NULL,
    ora_inizio TIME,
    ora_fine TIME,
    kw_erogati REAL NOT NULL,
    km_percorsi REAL DEFAULT 0,
    FOREIGN KEY (veicolo_id) REFERENCES veicoli(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS produzioni (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    impianto_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    data DATE NOT NULL,
    kw_prodotti REAL NOT NULL,
    FOREIGN KEY (impianto_id) REFERENCES impianti(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
