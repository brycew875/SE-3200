# Diné Art Registry - Resourceful API Project

An enterprise RESTful Web Application designed to manage an authentic inventory of Navajo textiles, silver jewelry, sandpaintings, and pottery using standard Python, SQLite, and vanilla ES6 JavaScript.

---

## Resource Definition

- **Managed Entity:** `crafts` (Navajo Fine Art Artifact)

### Data Attributes Specification
1. `id` (INTEGER, Primary Key) - Auto-incrementing unique identifier.
2. `title` (TEXT, Required) - Descriptive title of the craft piece.
3. `artist` (TEXT, Required) - Full name of the Navajo artisan or silversmith.
4. `category` (TEXT, Required) - Classification (e.g., *Weaving*, *Jewelry*, *Sandpainting*, *Pottery*, *Woodcarving*).
5. `price` (REAL, Required) - Market valuation expressed in USD ($).
6. `year_created` (INTEGER, Required) - 4-digit calendar year of creation.

---

## Database Schema (SQLite)

```sql
CREATE TABLE IF NOT EXISTS crafts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    year_created INTEGER NOT NULL
);
