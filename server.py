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

    cursor.execute(
        "SELECT data FROM results WHERE telegram_id = ?",
        (telegram_id,)
    )

    row = cursor.fetchone()
    conn.close()

    if not row:
        return None

    return json.loads(row[0])


@app.route("/result")
def result():
    telegram_id = request.args.get("user")

    if not telegram_id:
        return jsonify({"error": "user parameter required"}), 400

    data = get_user_result_from_db(telegram_id)

    if not data:
        return jsonify({"error": "result not found"}), 404

    return jsonify(data)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)