import json
import os
import sqlite3
from datetime import date, timedelta, datetime
from functools import wraps

from flask import (Flask, flash, g, redirect, render_template, request,
                   session, url_for)
from werkzeug.security import check_password_hash, generate_password_hash

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "auto-solari-dev-key-changeme")
DATABASE = os.path.join(os.path.dirname(__file__), "auto_solari.db")


# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------

def get_db():
    db = getattr(g, "_database", None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
        db.execute("PRAGMA foreign_keys = ON")
    return db


@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, "_database", None)
    if db is not None:
        db.close()


def init_db():
    with app.app_context():
        db = get_db()
        schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
        with open(schema_path) as f:
            db.executescript(f.read())
        db.commit()


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if "user_id" not in session:
            flash("Devi effettuare il login per accedere a questa pagina.", "warning")
            return redirect(url_for("login"))
        return f(*args, **kwargs)
    return decorated


def current_user():
    if "user_id" not in session:
        return None
    db = get_db()
    return db.execute("SELECT * FROM users WHERE id = ?", (session["user_id"],)).fetchone()


# ---------------------------------------------------------------------------
# Auth routes
# ---------------------------------------------------------------------------

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        nome = request.form["nome"].strip()
        cognome = request.form["cognome"].strip()
        email = request.form["email"].strip().lower()
        password = request.form["password"]
        via = request.form.get("via", "").strip()
        comune = request.form["comune"].strip()
        distretto = request.form["distretto"].strip()

        if not all([nome, cognome, email, password, comune, distretto]):
            flash("Tutti i campi obbligatori devono essere compilati.", "danger")
            return render_template("auth/register.html")

        db = get_db()
        if db.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone():
            flash("Email già registrata.", "danger")
            return render_template("auth/register.html")

        db.execute(
            "INSERT INTO users (nome, cognome, email, password_hash, via, comune, distretto) "
            "VALUES (?, ?, ?, ?, ?, ?, ?)",
            (nome, cognome, email, generate_password_hash(password), via, comune, distretto),
        )
        db.commit()
        flash("Registrazione completata! Puoi ora effettuare il login.", "success")
        return redirect(url_for("login"))

    return render_template("auth/register.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form["email"].strip().lower()
        password = request.form["password"]
        db = get_db()
        user = db.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        if user and check_password_hash(user["password_hash"], password):
            session["user_id"] = user["id"]
            flash(f"Benvenuto, {user['nome']}!", "success")
            return redirect(url_for("dashboard"))
        flash("Credenziali non valide.", "danger")

    return render_template("auth/login.html")


@app.route("/logout")
def logout():
    session.clear()
    flash("Logout effettuato.", "info")
    return redirect(url_for("index"))


# ---------------------------------------------------------------------------
# Public routes
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    return render_template("public/index.html", user=current_user())


@app.route("/public/ricerca")
def ricerca_pubblica():
    db = get_db()
    query = request.args.get("q", "").strip()
    tipo = request.args.get("tipo", "utenti")
    results = []

    if query:
        if tipo == "utenti":
            results = db.execute(
                "SELECT comune, distretto, COUNT(*) as totale FROM users "
                "WHERE comune LIKE ? OR distretto LIKE ? "
                "GROUP BY comune, distretto",
                (f"%{query}%", f"%{query}%"),
            ).fetchall()
        elif tipo == "impianti":
            results = db.execute(
                "SELECT i.tipo, i.kw_installati, u.comune, u.distretto "
                "FROM impianti i JOIN users u ON i.user_id = u.id "
                "WHERE u.comune LIKE ? OR u.distretto LIKE ? OR i.tipo LIKE ?",
                (f"%{query}%", f"%{query}%", f"%{query}%"),
            ).fetchall()
        elif tipo == "veicoli":
            results = db.execute(
                "SELECT v.tipo, v.marca, v.modello, u.comune, u.distretto "
                "FROM veicoli v JOIN users u ON v.user_id = u.id "
                "WHERE u.comune LIKE ? OR u.distretto LIKE ? OR v.tipo LIKE ?",
                (f"%{query}%", f"%{query}%", f"%{query}%"),
            ).fetchall()

    return render_template(
        "public/ricerca.html",
        results=results,
        query=query,
        tipo=tipo,
        user=current_user(),
    )


@app.route("/public/statistiche")
def statistiche_pubbliche():
    db = get_db()
    periodo = request.args.get("periodo", "mese")
    raggruppa = request.args.get("raggruppa", "comune")

    today = date.today()
    if periodo == "giorno":
        date_from = today
    elif periodo == "mese":
        date_from = today.replace(day=1)
    else:  # anno
        date_from = today.replace(month=1, day=1)

    group_col = "u.comune" if raggruppa == "comune" else "u.distretto"

    consumo = db.execute(
        f"SELECT {group_col} as label, SUM(r.kw_erogati) as totale, COUNT(DISTINCT r.user_id) as n_utenti "
        f"FROM ricariche r JOIN users u ON r.user_id = u.id "
        f"WHERE r.data >= ? GROUP BY {group_col} ORDER BY totale DESC",
        (date_from.isoformat(),),
    ).fetchall()

    produzione = db.execute(
        f"SELECT {group_col} as label, SUM(p.kw_prodotti) as totale "
        f"FROM produzioni p JOIN users u ON p.user_id = u.id "
        f"WHERE p.data >= ? GROUP BY {group_col} ORDER BY totale DESC",
        (date_from.isoformat(),),
    ).fetchall()

    return render_template(
        "public/statistiche.html",
        consumo=consumo,
        produzione=produzione,
        periodo=periodo,
        raggruppa=raggruppa,
        user=current_user(),
    )


# ---------------------------------------------------------------------------
# Private routes — dashboard
# ---------------------------------------------------------------------------

@app.route("/dashboard")
@login_required
def dashboard():
    db = get_db()
    uid = session["user_id"]
    today = date.today()
    month_start = today.replace(day=1)

    impianti = db.execute("SELECT * FROM impianti WHERE user_id = ?", (uid,)).fetchall()
    veicoli = db.execute("SELECT * FROM veicoli WHERE user_id = ?", (uid,)).fetchall()

    consumo_mese = db.execute(
        "SELECT SUM(kw_erogati) FROM ricariche WHERE user_id = ? AND data >= ?",
        (uid, month_start.isoformat()),
    ).fetchone()[0] or 0

    produzione_mese = db.execute(
        "SELECT SUM(kw_prodotti) FROM produzioni WHERE user_id = ? AND data >= ?",
        (uid, month_start.isoformat()),
    ).fetchone()[0] or 0

    ricariche_recenti = db.execute(
        "SELECT r.*, v.tipo, v.marca, v.modello FROM ricariche r "
        "JOIN veicoli v ON r.veicolo_id = v.id "
        "WHERE r.user_id = ? ORDER BY r.data DESC LIMIT 5",
        (uid,),
    ).fetchall()

    return render_template(
        "private/dashboard.html",
        user=current_user(),
        impianti=impianti,
        veicoli=veicoli,
        consumo_mese=consumo_mese,
        produzione_mese=produzione_mese,
        ricariche_recenti=ricariche_recenti,
    )


# ---------------------------------------------------------------------------
# Private — impianti
# ---------------------------------------------------------------------------

@app.route("/impianti")
@login_required
def impianti():
    db = get_db()
    rows = db.execute("SELECT * FROM impianti WHERE user_id = ?", (session["user_id"],)).fetchall()
    return render_template("private/impianti.html", user=current_user(), impianti=rows)


@app.route("/impianti/nuovo", methods=["GET", "POST"])
@login_required
def nuovo_impianto():
    if request.method == "POST":
        tipo = request.form["tipo"]
        kw = float(request.form["kw_installati"])
        data_inst = request.form["data_installazione"]
        db = get_db()
        db.execute(
            "INSERT INTO impianti (user_id, tipo, kw_installati, data_installazione) VALUES (?, ?, ?, ?)",
            (session["user_id"], tipo, kw, data_inst),
        )
        db.commit()
        flash("Impianto aggiunto.", "success")
        return redirect(url_for("impianti"))
    return render_template("private/form_impianto.html", user=current_user(), impianto=None)


@app.route("/impianti/<int:imp_id>/modifica", methods=["GET", "POST"])
@login_required
def modifica_impianto(imp_id):
    db = get_db()
    imp = db.execute(
        "SELECT * FROM impianti WHERE id = ? AND user_id = ?", (imp_id, session["user_id"])
    ).fetchone()
    if not imp:
        flash("Impianto non trovato.", "danger")
        return redirect(url_for("impianti"))

    if request.method == "POST":
        tipo = request.form["tipo"]
        kw = float(request.form["kw_installati"])
        data_inst = request.form["data_installazione"]
        db.execute(
            "UPDATE impianti SET tipo=?, kw_installati=?, data_installazione=? WHERE id=?",
            (tipo, kw, data_inst, imp_id),
        )
        db.commit()
        flash("Impianto aggiornato.", "success")
        return redirect(url_for("impianti"))

    return render_template("private/form_impianto.html", user=current_user(), impianto=imp)


@app.route("/impianti/<int:imp_id>/elimina", methods=["POST"])
@login_required
def elimina_impianto(imp_id):
    db = get_db()
    db.execute(
        "DELETE FROM impianti WHERE id = ? AND user_id = ?", (imp_id, session["user_id"])
    )
    db.commit()
    flash("Impianto eliminato.", "info")
    return redirect(url_for("impianti"))


# ---------------------------------------------------------------------------
# Private — veicoli
# ---------------------------------------------------------------------------

@app.route("/veicoli")
@login_required
def veicoli():
    db = get_db()
    rows = db.execute("SELECT * FROM veicoli WHERE user_id = ?", (session["user_id"],)).fetchall()
    return render_template("private/veicoli.html", user=current_user(), veicoli=rows)


@app.route("/veicoli/nuovo", methods=["GET", "POST"])
@login_required
def nuovo_veicolo():
    if request.method == "POST":
        tipo = request.form["tipo"]
        marca = request.form.get("marca", "")
        modello = request.form.get("modello", "")
        capacita = float(request.form["capacita_batteria"])
        km = float(request.form.get("km_totali", 0))
        db = get_db()
        db.execute(
            "INSERT INTO veicoli (user_id, tipo, marca, modello, capacita_batteria, km_totali) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (session["user_id"], tipo, marca, modello, capacita, km),
        )
        db.commit()
        flash("Veicolo aggiunto.", "success")
        return redirect(url_for("veicoli"))
    return render_template("private/form_veicolo.html", user=current_user(), veicolo=None)


@app.route("/veicoli/<int:v_id>/modifica", methods=["GET", "POST"])
@login_required
def modifica_veicolo(v_id):
    db = get_db()
    v = db.execute(
        "SELECT * FROM veicoli WHERE id = ? AND user_id = ?", (v_id, session["user_id"])
    ).fetchone()
    if not v:
        flash("Veicolo non trovato.", "danger")
        return redirect(url_for("veicoli"))

    if request.method == "POST":
        tipo = request.form["tipo"]
        marca = request.form.get("marca", "")
        modello = request.form.get("modello", "")
        capacita = float(request.form["capacita_batteria"])
        km = float(request.form.get("km_totali", 0))
        db.execute(
            "UPDATE veicoli SET tipo=?, marca=?, modello=?, capacita_batteria=?, km_totali=? WHERE id=?",
            (tipo, marca, modello, capacita, km, v_id),
        )
        db.commit()
        flash("Veicolo aggiornato.", "success")
        return redirect(url_for("veicoli"))

    return render_template("private/form_veicolo.html", user=current_user(), veicolo=v)


@app.route("/veicoli/<int:v_id>/elimina", methods=["POST"])
@login_required
def elimina_veicolo(v_id):
    db = get_db()
    db.execute(
        "DELETE FROM veicoli WHERE id = ? AND user_id = ?", (v_id, session["user_id"])
    )
    db.commit()
    flash("Veicolo eliminato.", "info")
    return redirect(url_for("veicoli"))


# ---------------------------------------------------------------------------
# Private — ricariche
# ---------------------------------------------------------------------------

@app.route("/ricariche")
@login_required
def ricariche():
    db = get_db()
    uid = session["user_id"]
    rows = db.execute(
        "SELECT r.*, v.tipo as v_tipo, v.marca, v.modello "
        "FROM ricariche r JOIN veicoli v ON r.veicolo_id = v.id "
        "WHERE r.user_id = ? ORDER BY r.data DESC",
        (uid,),
    ).fetchall()
    veicoli_list = db.execute("SELECT * FROM veicoli WHERE user_id = ?", (uid,)).fetchall()
    return render_template(
        "private/ricariche.html", user=current_user(), ricariche=rows, veicoli=veicoli_list
    )


@app.route("/ricariche/nuova", methods=["GET", "POST"])
@login_required
def nuova_ricarica():
    db = get_db()
    uid = session["user_id"]
    veicoli_list = db.execute("SELECT * FROM veicoli WHERE user_id = ?", (uid,)).fetchall()

    if request.method == "POST":
        veicolo_id = int(request.form["veicolo_id"])
        kw = float(request.form["kw_erogati"])
        km = float(request.form.get("km_percorsi", 0))
        ora_inizio = request.form.get("ora_inizio") or None
        ora_fine = request.form.get("ora_fine") or None

        # Supporto inserimento per range di date
        data_inizio = request.form["data_inizio"]
        data_fine = request.form.get("data_fine") or data_inizio

        d_start = date.fromisoformat(data_inizio)
        d_end = date.fromisoformat(data_fine)
        delta = (d_end - d_start).days + 1

        kw_giorno = kw / delta
        km_giorno = km / delta

        current = d_start
        while current <= d_end:
            db.execute(
                "INSERT INTO ricariche (veicolo_id, user_id, data, ora_inizio, ora_fine, kw_erogati, km_percorsi) "
                "VALUES (?, ?, ?, ?, ?, ?, ?)",
                (veicolo_id, uid, current.isoformat(), ora_inizio, ora_fine, round(kw_giorno, 4), round(km_giorno, 4)),
            )
            current += timedelta(days=1)

        db.commit()
        flash(f"Ricarica registrata per {delta} giorno/i.", "success")
        return redirect(url_for("ricariche"))

    return render_template(
        "private/form_ricarica.html", user=current_user(), veicoli=veicoli_list, today=date.today().isoformat()
    )


@app.route("/ricariche/importa-json", methods=["GET", "POST"])
@login_required
def importa_ricariche_json():
    db = get_db()
    uid = session["user_id"]
    veicoli_list = db.execute("SELECT * FROM veicoli WHERE user_id = ?", (uid,)).fetchall()

    if request.method == "POST":
        raw = request.form.get("json_data", "")
        try:
            data = json.loads(raw)
            if isinstance(data, dict):
                data = [data]
            count = 0
            for item in data:
                veicolo_id = int(item["veicolo_id"])
                kw = float(item["kw_erogati"])
                record_date = item.get("data", date.today().isoformat())
                ora_inizio = item.get("ora_inizio")
                ora_fine = item.get("ora_fine")
                km = float(item.get("km_percorsi", 0))
                db.execute(
                    "INSERT INTO ricariche (veicolo_id, user_id, data, ora_inizio, ora_fine, kw_erogati, km_percorsi) "
                    "VALUES (?, ?, ?, ?, ?, ?, ?)",
                    (veicolo_id, uid, record_date, ora_inizio, ora_fine, kw, km),
                )
                count += 1
            db.commit()
            flash(f"Importati {count} record con successo.", "success")
            return redirect(url_for("ricariche"))
        except (json.JSONDecodeError, KeyError, ValueError) as e:
            flash(f"Errore nel JSON: {e}", "danger")

    example = json.dumps(
        [{"veicolo_id": 1, "data": date.today().isoformat(), "ora_inizio": "08:00",
          "ora_fine": "10:00", "kw_erogati": 15.5, "km_percorsi": 80}],
        indent=2,
    )
    return render_template(
        "private/importa_json.html", user=current_user(), veicoli=veicoli_list, example=example
    )


@app.route("/ricariche/<int:r_id>/elimina", methods=["POST"])
@login_required
def elimina_ricarica(r_id):
    db = get_db()
    db.execute(
        "DELETE FROM ricariche WHERE id = ? AND user_id = ?", (r_id, session["user_id"])
    )
    db.commit()
    flash("Ricarica eliminata.", "info")
    return redirect(url_for("ricariche"))


# ---------------------------------------------------------------------------
# Private — produzioni
# ---------------------------------------------------------------------------

@app.route("/produzioni")
@login_required
def produzioni():
    db = get_db()
    uid = session["user_id"]
    rows = db.execute(
        "SELECT p.*, i.tipo as i_tipo, i.kw_installati "
        "FROM produzioni p JOIN impianti i ON p.impianto_id = i.id "
        "WHERE p.user_id = ? ORDER BY p.data DESC",
        (uid,),
    ).fetchall()
    impianti_list = db.execute("SELECT * FROM impianti WHERE user_id = ?", (uid,)).fetchall()
    return render_template(
        "private/produzioni.html", user=current_user(), produzioni=rows, impianti=impianti_list
    )


@app.route("/produzioni/nuova", methods=["GET", "POST"])
@login_required
def nuova_produzione():
    db = get_db()
    uid = session["user_id"]
    impianti_list = db.execute("SELECT * FROM impianti WHERE user_id = ?", (uid,)).fetchall()

    if request.method == "POST":
        impianto_id = int(request.form["impianto_id"])
        kw = float(request.form["kw_prodotti"])
        data_inizio = request.form["data_inizio"]
        data_fine = request.form.get("data_fine") or data_inizio

        d_start = date.fromisoformat(data_inizio)
        d_end = date.fromisoformat(data_fine)
        delta = (d_end - d_start).days + 1
        kw_giorno = kw / delta

        current = d_start
        while current <= d_end:
            db.execute(
                "INSERT INTO produzioni (impianto_id, user_id, data, kw_prodotti) VALUES (?, ?, ?, ?)",
                (impianto_id, uid, current.isoformat(), round(kw_giorno, 4)),
            )
            current += timedelta(days=1)

        db.commit()
        flash(f"Produzione registrata per {delta} giorno/i.", "success")
        return redirect(url_for("produzioni"))

    return render_template(
        "private/form_produzione.html",
        user=current_user(),
        impianti=impianti_list,
        today=date.today().isoformat(),
    )


@app.route("/produzioni/<int:p_id>/elimina", methods=["POST"])
@login_required
def elimina_produzione(p_id):
    db = get_db()
    db.execute(
        "DELETE FROM produzioni WHERE id = ? AND user_id = ?", (p_id, session["user_id"])
    )
    db.commit()
    flash("Produzione eliminata.", "info")
    return redirect(url_for("produzioni"))


# ---------------------------------------------------------------------------
# Private — statistiche personali
# ---------------------------------------------------------------------------

@app.route("/statistiche")
@login_required
def statistiche_personali():
    db = get_db()
    uid = session["user_id"]
    periodo = request.args.get("periodo", "mese")

    today = date.today()
    if periodo == "giorno":
        date_from = today
        label_fmt = "%d/%m/%Y"
    elif periodo == "mese":
        date_from = today.replace(day=1)
        label_fmt = "%d/%m"
    else:
        date_from = today.replace(month=1, day=1)
        label_fmt = "%m/%Y"

    consumo = db.execute(
        "SELECT data, SUM(kw_erogati) as totale FROM ricariche "
        "WHERE user_id = ? AND data >= ? GROUP BY data ORDER BY data",
        (uid, date_from.isoformat()),
    ).fetchall()

    produzione = db.execute(
        "SELECT data, SUM(kw_prodotti) as totale FROM produzioni "
        "WHERE user_id = ? AND data >= ? GROUP BY data ORDER BY data",
        (uid, date_from.isoformat()),
    ).fetchall()

    km = db.execute(
        "SELECT data, SUM(km_percorsi) as totale FROM ricariche "
        "WHERE user_id = ? AND data >= ? GROUP BY data ORDER BY data",
        (uid, date_from.isoformat()),
    ).fetchall()

    return render_template(
        "private/statistiche.html",
        user=current_user(),
        consumo=consumo,
        produzione=produzione,
        km=km,
        periodo=periodo,
    )


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    init_db()
    app.run(debug=True)
