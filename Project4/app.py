import json
import re
import sqlite3
from http.server import HTTPServer, BaseHTTPRequestHandler
from typing import Dict, List, Optional, Any

DB_FILENAME = "navajo_crafts.db"

# ==============================================================================
# DATA ACCESS OBJECT (DAO) CLASS
# ==============================================================================
class CraftRepository:
    """Encapsulates all SQLite persistence and SQL execution logic."""
    
    def __init__(self, db_path: str = DB_FILENAME):
        self.db_path = db_path
        self._initialize_schema()

    def get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _initialize_schema(self) -> None:
        """Creates table schema if non-existent and populates initial seed records."""
        with self.get_connection() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS crafts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    artist TEXT NOT NULL,
                    category TEXT NOT NULL,
                    price REAL NOT NULL,
                    year_created INTEGER NOT NULL
                );
            """)
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM crafts")
            if cursor.fetchone()[0] == 0:
                conn.executemany("""
                    INSERT INTO crafts (title, artist, category, price, year_created)
                    VALUES (?, ?, ?, ?, ?)
                """, [
                    ("Teec Nos Pos Masterwork", "Loretta Begay", "Weaving", 3450.00, 2023),
                    ("Kingman Turquoise & Silver Cuff", "Harrison Yazzie", "Jewelry", 850.00, 2022),
                    ("Four Sacred Mountains Sandpainting", "Kee Nez", "Sandpainting", 520.00, 2024),
                    ("Hand-Burnished Pine Pitch Vessel", "Alice Cling", "Pottery", 1100.00, 2021)
                ])
                conn.commit()

    def find_all(self) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, title, artist, category, price, year_created FROM crafts ORDER BY id DESC")
            return [dict(row) for row in cursor.fetchall()]

    def find_by_id(self, craft_id: int) -> Optional[Dict[str, Any]]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, title, artist, category, price, year_created FROM crafts WHERE id = ?", (craft_id,))
            row = cursor.fetchone()
            return dict(row) if row else None

    def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO crafts (title, artist, category, price, year_created)
                VALUES (?, ?, ?, ?, ?)
            """, (
                str(data["title"]).strip(),
                str(data["artist"]).strip(),
                str(data["category"]).strip(),
                float(data["price"]),
                int(data["year_created"])
            ))
            conn.commit()
            return self.find_by_id(cursor.lastrowid)

    def update(self, craft_id: int, data: Dict[str, Any]) -> bool:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE crafts
                SET title = ?, artist = ?, category = ?, price = ?, year_created = ?
                WHERE id = ?
            """, (
                str(data["title"]).strip(),
                str(data["artist"]).strip(),
                str(data["category"]).strip(),
                float(data["price"]),
                int(data["year_created"]),
                craft_id
            ))
            conn.commit()
            return cursor.rowcount > 0

    def delete(self, craft_id: int) -> bool:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM crafts WHERE id = ?", (craft_id,))
            conn.commit()
            return cursor.rowcount > 0


# Repository Singleton Instance
repository = CraftRepository()

# ==============================================================================
# REST API CONTROLLER HANDLER
# ==============================================================================
class RESTRequestHandler(BaseHTTPRequestHandler):

    def _set_cors_and_headers(self, status: int = 200, content_type: str = "application/json") -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Accept")
        self.end_headers()

    def do_OPTIONS(self) -> None:
        """Handles preflight CORS requests."""
        self._set_cors_and_headers(204, "text/plain")

    def _parse_json_payload(self) -> Optional[Dict[str, Any]]:
        try:
            length = int(self.headers.get("Content-Length", 0))
            if length == 0:
                return None
            body = self.rfile.read(length).decode("utf-8")
            return json.loads(body)
        except (ValueError, json.JSONDecodeError):
            return None

    def _send_json_error(self, status: int, message: str) -> None:
        self._set_cors_and_headers(status)
        response_data = {"error": True, "status": status, "message": message}
        self.wfile.write(json.dumps(response_data).encode("utf-8"))

    def _validate_payload(self, data: Optional[Dict[str, Any]]) -> bool:
        if not data:
            return False
        required_keys = ["title", "artist", "category", "price", "year_created"]
        return all(key in data and data[key] is not None for key in required_keys)

    # --------------------------------------------------------------------------
    # RESTFUL ROUTE HANDLERS
    # --------------------------------------------------------------------------
    def do_GET(self) -> None:
        # Route 1: List (GET /api/crafts)
        if self.path in ["/api/crafts", "/api/crafts/"]:
            records = repository.find_all()
            self._set_cors_and_headers(200)
            self.wfile.write(json.dumps(records).encode("utf-8"))
            return

        # Route 2: Retrieve (GET /api/crafts/<id>)
        match = re.match(r"^/api/crafts/(\d+)$", self.path)
        if match:
            craft_id = int(match.group(1))
            craft = repository.find_by_id(craft_id)
            if craft:
                self._set_cors_and_headers(200)
                self.wfile.write(json.dumps(craft).encode("utf-8"))
            else:
                self._send_json_error(404, f"Craft record with ID {craft_id} was not found.")
            return

        self._send_json_error(404, "Invalid endpoint URI.")

    def do_POST(self) -> None:
        # Route 3: Create (POST /api/crafts)
        if self.path in ["/api/crafts", "/api/crafts/"]:
            payload = self._parse_json_payload()
            if not self._validate_payload(payload):
                self._send_json_error(400, "Malformed request. Missing required fields: title, artist, category, price, year_created.")
                return
            new_craft = repository.create(payload)
            self._set_cors_and_headers(201)
            self.wfile.write(json.dumps(new_craft).encode("utf-8"))
            return

        self._send_json_error(404, "Invalid route for POST operation.")

    def do_PUT(self) -> None:
        # Route 4: Replace (PUT /api/crafts/<id>)
        match = re.match(r"^/api/crafts/(\d+)$", self.path)
        if match:
            craft_id = int(match.group(1))
            payload = self._parse_json_payload()
            if not self._validate_payload(payload):
                self._send_json_error(400, "Malformed payload for record update.")
                return
            
            if repository.update(craft_id, payload):
                updated_craft = repository.find_by_id(craft_id)
                self._set_cors_and_headers(200)
                self.wfile.write(json.dumps(updated_craft).encode("utf-8"))
            else:
                self._send_json_error(404, f"Craft record with ID {craft_id} was not found.")
            return

        self._send_json_error(404, "Invalid route for PUT operation.")

    def do_DELETE(self) -> None:
        # Route 5: Delete (DELETE /api/crafts/<id>)
        match = re.match(r"^/api/crafts/(\d+)$", self.path)
        if match:
            craft_id = int(match.group(1))
            if repository.delete(craft_id):
                self._set_cors_and_headers(200)
                self.wfile.write(json.dumps({"success": True, "message": f"Record {craft_id} successfully deleted."}).encode("utf-8"))
            else:
                self._send_json_error(404, f"Craft record with ID {craft_id} was not found.")
            return

        self._send_json_error(404, "Invalid route for DELETE operation.")


def main(host: str = "0.0.0.0", port: int = 8000) -> None:
    server = HTTPServer((host, port), RESTRequestHandler)
    print(f"Server initialized. Listening at http://{host}:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer gracefully shutting down.")
        server.server_close()

if __name__ == "__main__":
    main()
