import json
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse
from database import LandmarksDB

db = LandmarksDB("navajo_landmarks.db")


class LandmarkRequestHandler(BaseHTTPRequestHandler):
    """RESTful HTTP request handler for the /landmarks resource."""

    REQUIRED_FIELDS = (
        "name",
        "navajo_name",
        "region",
        "category",
        "elevation_ft",
        "description",
    )

    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _send_json(self, status_code, payload, extra_headers=None):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self._send_cors_headers()
        if extra_headers:
            for key, value in extra_headers.items():
                self.send_header(key, value)
        self.end_headers()
        self.wfile.write(body)

    def _parse_route(self):
        """
        Parses the URL path.
        Returns (route_type, resource_id):
          - ("collection", None) for /landmarks
          - ("member", int_id)   for /landmarks/<int_id>
          - ("not_found", None)  for any invalid path or non-integer ID
        """
        clean_path = urlparse(self.path).path.rstrip("/")
        if clean_path == "/landmarks":
            return "collection", None

        parts = clean_path.split("/")
        # Expected format: ['', 'landmarks', '<id>']
        if len(parts) == 3 and parts[1] == "landmarks":
            if parts[2].isdigit():
                return "member", int(parts[2])
            return "not_found", None

        return "not_found", None

    def _parse_and_validate_body(self):
        content_length = int(self.headers.get("Content-Length", 0))
        if content_length == 0:
            return None, "Request body is empty."

        raw_body = self.rfile.read(content_length).decode("utf-8")
        try:
            data = json.loads(raw_body)
        except json.JSONDecodeError:
            return None, "Request body must be valid JSON."

        if not isinstance(data, dict):
            return None, "JSON payload must be an object."

        missing = [
            field for field in self.REQUIRED_FIELDS
            if field not in data or str(data[field]).strip() == ""
        ]
        if missing:
            return None, f"Missing required fields: {', '.join(missing)}"

        try:
            elevation = int(data["elevation_ft"])
        except (ValueError, TypeError):
            return None, "Field 'elevation_ft' must be a valid integer."

        cleaned = {
            "name": str(data["name"]).strip(),
            "navajo_name": str(data["navajo_name"]).strip(),
            "region": str(data["region"]).strip(),
            "category": str(data["category"]).strip(),
            "elevation_ft": elevation,
            "description": str(data["description"]).strip(),
        }
        return cleaned, None

    # --- Preflight CORS ---
    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    # --- List & Retrieve ---
    def do_GET(self):
        route_type, landmark_id = self._parse_route()

        if route_type == "collection":
            landmarks = db.get_all_landmarks()
            self._send_json(200, landmarks)
        elif route_type == "member":
            landmark = db.get_landmark(landmark_id)
            if landmark is None:
                self._send_json(404, {"error": f"Landmark with ID {landmark_id} not found."})
            else:
                self._send_json(200, landmark)
        else:
            self._send_json(404, {"error": "Requested resource path was not found."})

    # --- Create ---
    def do_POST(self):
        route_type, _ = self._parse_route()

        if route_type == "member":
            self._send_json(
                405,
                {"error": "Method POST is not allowed on an individual landmark resource."},
                extra_headers={"Allow": "GET, PUT, DELETE, OPTIONS"},
            )
            return

        if route_type != "collection":
            self._send_json(404, {"error": "Requested resource path was not found."})
            return

        data, error = self._parse_and_validate_body()
        if error:
            self._send_json(400, {"error": error})
            return

        created = db.create_landmark(
            name=data["name"],
            navajo_name=data["navajo_name"],
            region=data["region"],
            category=data["category"],
            elevation_ft=data["elevation_ft"],
            description=data["description"],
        )
        self._send_json(201, created)

    # --- Replace ---
    def do_PUT(self):
        route_type, landmark_id = self._parse_route()

        if route_type == "collection":
            self._send_json(
                405,
                {"error": "Method PUT requires a landmark ID in the path (/landmarks/<id>)."},
                extra_headers={"Allow": "GET, POST, OPTIONS"},
            )
            return

        if route_type != "member":
            self._send_json(404, {"error": "Requested resource path was not found."})
            return

        data, error = self._parse_and_validate_body()
        if error:
            self._send_json(400, {"error": error})
            return

        updated = db.replace_landmark(
            landmark_id=landmark_id,
            name=data["name"],
            navajo_name=data["navajo_name"],
            region=data["region"],
            category=data["category"],
            elevation_ft=data["elevation_ft"],
            description=data["description"],
        )
        if updated is None:
            self._send_json(404, {"error": f"Landmark with ID {landmark_id} not found."})
        else:
            self._send_json(200, updated)

    # --- Delete ---
    def do_DELETE(self):
        route_type, landmark_id = self._parse_route()

        if route_type == "collection":
            self._send_json(
                405,
                {"error": "Method DELETE requires a landmark ID in the path (/landmarks/<id>)."},
                extra_headers={"Allow": "GET, POST, OPTIONS"},
            )
            return

        if route_type != "member":
            self._send_json(404, {"error": "Requested resource path was not found."})
            return

        deleted = db.delete_landmark(landmark_id)
        if not deleted:
            self._send_json(404, {"error": f"Landmark with ID {landmark_id} not found."})
        else:
            self._send_json(200, {"message": "Landmark deleted successfully.", "id": landmark_id})


def run_server(host="127.0.0.1", port=8000):
    server = HTTPServer((host, port), LandmarkRequestHandler)
    print(f"Navajo Nation Landmarks API running at http://{host}:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        server.server_close()


if __name__ == "__main__":
    run_server()
