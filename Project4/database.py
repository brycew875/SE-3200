import sqlite3


class LandmarksDB:
    """Encapsulates all SQLite database operations for Navajo Nation landmarks."""

    def __init__(self, db_path="navajo_landmarks.db"):
        self.db_path = db_path
        self._initialize_db()

    def _get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _initialize_db(self):
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS landmarks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            navajo_name TEXT NOT NULL,
            region TEXT NOT NULL,
            category TEXT NOT NULL,
            elevation_ft INTEGER NOT NULL,
            description TEXT NOT NULL
        );
        """
        with self._get_connection() as conn:
            conn.execute(create_table_sql)
            count = conn.execute("SELECT COUNT(*) FROM landmarks").fetchone()[0]
            if count == 0:
                self._seed_initial_data(conn)

    def _seed_initial_data(self, conn):
        seed_records = [
            (
                "Window Rock",
                "Tségháhoodzání",
                "Fort Defiance Agency (AZ)",
                "Capital & Historic Site",
                6820,
                "Capital of the Navajo Nation, featuring a massive natural sandstone arch and the Navajo Nation Council Chamber."
            ),
            (
                "Monument Valley",
                "Tsé Biiʼ Ndzisgaii",
                "Western Agency (AZ / UT)",
                "Tribal Park",
                5564,
                "Iconic valley of towering red sandstone buttes and mesas spanning the Arizona-Utah border."
            ),
            (
                "Canyon de Chelly",
                "Tséyiʼ",
                "Chinle Agency (AZ)",
                "National Monument",
                5500,
                "Deep sandstone canyon system home to ancestral cliff dwellings, Spider Rock, and living Diné communities."
            ),
            (
                "Shiprock Pinnacle",
                "Tsé Bitʼaʼí",
                "Northern Agency (NM)",
                "Sacred Landmark",
                7177,
                "Volcanic neck rising nearly 1,583 feet above the high-desert plain, central to Diné oral history."
            ),
            (
                "Chaco Culture Region",
                "Tsé Bíyahʼííʼáhí",
                "Eastern Agency (NM)",
                "Ancestral Site",
                6200,
                "Major ancestral center of masonry great houses and astronomical alignments in the San Juan Basin."
            ),
        ]
        conn.executemany(
            """
            INSERT INTO landmarks (name, navajo_name, region, category, elevation_ft, description)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            seed_records,
        )

    @staticmethod
    def _row_to_dict(row):
        return {
            "id": row["id"],
            "name": row["name"],
            "navajo_name": row["navajo_name"],
            "region": row["region"],
            "category": row["category"],
            "elevation_ft": row["elevation_ft"],
            "description": row["description"],
        }

    def get_all_landmarks(self):
        with self._get_connection() as conn:
            rows = conn.execute("SELECT * FROM landmarks ORDER BY id ASC").fetchall()
            return [self._row_to_dict(row) for row in rows]

    def get_landmark(self, landmark_id):
        with self._get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM landmarks WHERE id = ?", (landmark_id,)
            ).fetchone()
            return self._row_to_dict(row) if row else None

    def create_landmark(self, name, navajo_name, region, category, elevation_ft, description):
        with self._get_connection() as conn:
            cursor = conn.execute(
                """
                INSERT INTO landmarks (name, navajo_name, region, category, elevation_ft, description)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (name, navajo_name, region, category, elevation_ft, description),
            )
            new_id = cursor.lastrowid
            row = conn.execute(
                "SELECT * FROM landmarks WHERE id = ?", (new_id,)
            ).fetchone()
            return self._row_to_dict(row)

    def replace_landmark(self, landmark_id, name, navajo_name, region, category, elevation_ft, description):
        with self._get_connection() as conn:
            cursor = conn.execute(
                """
                UPDATE landmarks
                SET name = ?, navajo_name = ?, region = ?, category = ?, elevation_ft = ?, description = ?
                WHERE id = ?
                """,
                (name, navajo_name, region, category, elevation_ft, description, landmark_id),
            )
            if cursor.rowcount == 0:
                return None
            row = conn.execute(
                "SELECT * FROM landmarks WHERE id = ?", (landmark_id,)
            ).fetchone()
            return self._row_to_dict(row)

    def delete_landmark(self, landmark_id):
        with self._get_connection() as conn:
            cursor = conn.execute(
                "DELETE FROM landmarks WHERE id = ?", (landmark_id,)
            )
            return cursor.rowcount > 0
