# Diné Bikéyah — Navajo Nation Landmarks Manager

A full-stack CRUD web application for cataloging and managing significant cultural, historic, and geographic landmarks across the Navajo Nation. Built with a Python RESTful API server, SQLite persistence, and a vanilla HTML/CSS/JavaScript client.

## Resource & Attributes

- **Resource Name:** `landmarks` (singular: `Landmark`)
- **Attributes:**
  - `id` (`INTEGER`): Unique primary key identifier for each landmark.
  - `name` (`TEXT`): Common English name of the landmark.
  - `navajo_name` (`TEXT`): Traditional name in *Diné Bizaad* (the Navajo language).
  - `region` (`TEXT`): Navajo Nation Agency and state location (e.g., Chinle Agency, Northern Agency).
  - `category` (`TEXT`): Classification of the site (e.g., Sacred Landmark, Tribal Park, National Monument, Capital & Historic Site, Ancestral Site).
  - `elevation_ft` (`INTEGER`): Elevation of the site in feet above sea level.
  - `description` (`TEXT`): Summary of the landmark's cultural, historical, and geographic significance.

## Database Schema

```sql
CREATE TABLE IF NOT EXISTS landmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    navajo_name TEXT NOT NULL,
    region TEXT NOT NULL,
    category TEXT NOT NULL,
    elevation_ft INTEGER NOT NULL,
    description TEXT NOT NULL
);
