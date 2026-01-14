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

    # Убеждаемся что это строка
    telegram_id = str(telegram_id).strip()
    
    print(f"🔹 DB QUERY: SELECT data FROM results WHERE telegram_id = '{telegram_id}'")
    
    cursor.execute(
        "SELECT data FROM results WHERE telegram_id = ?",
        (telegram_id,)
    )

    row = cursor.fetchone()
    
    # Проверяем все записи в БД для отладки
    cursor.execute("SELECT telegram_id FROM results")
    all_ids = cursor.fetchall()
    print(f"🔹 DB DEBUG: Все telegram_id в БД: {[str(r[0]) for r in all_ids]}")
    
    conn.close()

    if not row:
        return None

    return json.loads(row[0])


@app.route("/result")
def result():
    telegram_id = request.args.get("user")

    print(f"🔹 GET /result: user={telegram_id}, type={type(telegram_id).__name__ if telegram_id else None}")

    if not telegram_id:
        print("❌ GET /result: user parameter missing")
        return jsonify({"error": "user parameter required"}), 400

    # Убеждаемся что это строка
    telegram_id = str(telegram_id).strip()
    print(f"🔹 GET /result: searching for telegram_id='{telegram_id}'")

    data = get_user_result_from_db(telegram_id)

    if not data:
        print(f"❌ GET /result: data not found for telegram_id='{telegram_id}'")
        return jsonify({"error": "result not found"}), 404

    print(f"✅ GET /result: data found for telegram_id='{telegram_id}'")
    return jsonify(data)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)