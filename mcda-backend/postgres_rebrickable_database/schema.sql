-- Tworzenie rozszerzeń
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Tworzenie tabel
CREATE TABLE part_categories (
                                 id SERIAL PRIMARY KEY,
                                 name TEXT NOT NULL
);

CREATE TABLE colors (
                        id SERIAL PRIMARY KEY,
                        name TEXT NOT NULL,
                        rgb TEXT NOT NULL,
                        is_trans BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE parts (
                       part_num TEXT PRIMARY KEY,
                       name TEXT NOT NULL,
                       part_cat_id INTEGER NOT NULL REFERENCES part_categories(id),
                       part_material TEXT
);

CREATE TABLE part_relationships (
                                    rel_type TEXT NOT NULL,
                                    child_part_num TEXT NOT NULL REFERENCES parts(part_num),
                                    parent_part_num TEXT NOT NULL REFERENCES parts(part_num),
                                    PRIMARY KEY (rel_type, child_part_num, parent_part_num)
);

CREATE TABLE elements (
                          element_id TEXT PRIMARY KEY,
                          part_num TEXT NOT NULL REFERENCES parts(part_num),
                          color_id INTEGER NOT NULL REFERENCES colors(id),
                          design_id TEXT
);

CREATE TABLE themes (
                        id SERIAL PRIMARY KEY,
                        name TEXT NOT NULL,
                        parent_id INTEGER REFERENCES themes(id)
);

CREATE TABLE sets (
                      set_num TEXT PRIMARY KEY,
                      name TEXT NOT NULL,
                      year INTEGER NOT NULL,
                      theme_id INTEGER NOT NULL REFERENCES themes(id),
                      num_parts INTEGER NOT NULL,
                      img_url TEXT
);

CREATE TABLE minifigs (
                          fig_num TEXT PRIMARY KEY,
                          name TEXT,
                          num_parts INTEGER NOT NULL,
                          img_url TEXT
);

CREATE TABLE inventories (
                             id SERIAL PRIMARY KEY,
                             version INTEGER NOT NULL,
                             set_num TEXT NOT NULL
);

CREATE TABLE inventory_parts (
                                 inventory_id INTEGER NOT NULL REFERENCES inventories(id),
                                 part_num TEXT NOT NULL REFERENCES parts(part_num),
                                 color_id INTEGER NOT NULL REFERENCES colors(id),
                                 quantity INTEGER NOT NULL,
                                 is_spare BOOLEAN NOT NULL DEFAULT false,
                                 img_url TEXT,
                                 PRIMARY KEY (inventory_id, part_num, color_id, is_spare)
);

CREATE TABLE inventory_sets (
                                inventory_id INTEGER NOT NULL REFERENCES inventories(id),
                                set_num TEXT NOT NULL REFERENCES sets(set_num),
                                quantity INTEGER NOT NULL,
                                PRIMARY KEY (inventory_id, set_num)
);

CREATE TABLE inventory_minifigs (
                                    inventory_id INTEGER NOT NULL REFERENCES inventories(id),
                                    fig_num TEXT NOT NULL REFERENCES minifigs(fig_num),
                                    quantity INTEGER NOT NULL,
                                    PRIMARY KEY (inventory_id, fig_num)
);

ALTER TABLE sets ADD COLUMN price NUMERIC(10, 2);

ALTER TABLE parts
    ADD COLUMN num_sets INTEGER;

WITH part_counts AS (
    SELECT
        ip.part_num,
        COUNT(DISTINCT i.set_num) as set_count
    FROM inventory_parts ip
             JOIN inventories i ON ip.inventory_id = i.id
    GROUP BY ip.part_num
)
UPDATE parts p
SET num_sets = COALESCE(pc.set_count, 0)
    FROM part_counts pc
WHERE p.part_num = pc.part_num;

UPDATE parts
SET num_sets = 0
WHERE num_sets IS NULL;

-- Tworzenie indeksów
CREATE INDEX IF NOT EXISTS idx_parts_num_sets ON parts(num_sets);
CREATE INDEX IF NOT EXISTS idx_parts_category ON parts(part_cat_id);
CREATE INDEX IF NOT EXISTS idx_sets_theme ON sets(theme_id);
CREATE INDEX IF NOT EXISTS idx_inventories_set ON inventories(set_num);
CREATE INDEX IF NOT EXISTS idx_inventory_parts_part ON inventory_parts(part_num);
CREATE INDEX IF NOT EXISTS idx_inventory_parts_color ON inventory_parts(color_id);
CREATE INDEX IF NOT EXISTS idx_themes_parent ON themes(parent_id);
