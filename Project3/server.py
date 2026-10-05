from http.server import HTTPServer, BaseHTTPRequestHandler
import json

class Server(BaseHTTPRequestHandler):

    def do_GET(self):

        if self.path == "/":
            with open("client/index.html", "rb") as file:
                page = file.read()

            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self.end_headers()

            self.wfile.write(page)

        elif self.path == "/style.css":
            with open("client/style.css", "rb") as file:
                css = file.read()

            self.send_response(200)
            self.send_header("Content-Type", "text/css")
            self.end_headers()

            self.wfile.write(css)

        elif self.path == "/script.js":
            with open("client/script.js", "rb") as file:
                javascript = file.read()

            self.send_response(200)
            self.send_header("Content-Type", "text/javascript")
            self.end_headers()

            self.wfile.write(javascript)

        elif self.path == "/messages":

            with open("messages.txt", "r") as file:
                messages = [line.strip() for line in file]

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()

            self.wfile.write(json.dumps(messages).encode())

        else:
            self.send_response(404)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()

            self.wfile.write(b"Page not found.")


    def do_POST(self):

        if self.path == "/messages":

            length = int(self.headers["Content-Length"])
            data = self.rfile.read(length)

            data = json.loads(data)

            message = data["message"]

            with open("messages.txt", "a") as file:
                file.write(message + "\n")

            self.send_response(201)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()

        else:
            self.send_response(404)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()

            self.wfile.write(b"Page not found.")


server = HTTPServer(("localhost", 8000), Server)

print("Server is running at http://localhost:8000")

server.serve_forever()