from flask import Flask, jsonify, request
import sqlite3
import json
import os

app = Flask(__name__)

BASE_DIR = os.path.dirname(__file__)
DB_PATH = os.path.join(BASE_DIR, "database.db")


def get_user_result_from_db(telegram_id):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    telegram_id = str(telegram_id).strip()

    print(f"DB QUERY: SELECT data FROM results WHERE telegram_id = '{telegram_id}'")

    cursor.execute(
        "SELECT data FROM results WHERE telegram_id = ?",
        (telegram_id,)
    )

    row = cursor.fetchone()

    cursor.execute("SELECT telegram_id FROM results")
    all_ids = cursor.fetchall()
    print(f"DB DEBUG: {[str(r[0]) for r in all_ids]}")

    conn.close()

    if not row:
        return None

    return json.loads(row[0])


@app.route("/result")
def result():
    telegram_id = request.args.get("user")

    print(f"GET /result: user={telegram_id}")

    if not telegram_id:
        return jsonify({"error": "user parameter required"}), 400

    telegram_id = str(telegram_id).strip()

    data = get_user_result_from_db(telegram_id)

    if not data:
        return jsonify({"error": "result not found"}), 404

    return jsonify(data)


# 🔥 ВАЖНО: правильный запуск для Railway
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=False)