-- Migración: Cambiar isNovel (Boolean) por basedOn (String) y agregar format
-- Preserva los datos existentes: isNovel=true → basedOn="novela"

-- Paso 1: Crear tabla temporal con nueva estructura
CREATE TABLE "Series_new" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "originalTitle" TEXT,
    "year" INTEGER,
    "type" TEXT NOT NULL,
    "basedOn" TEXT,
    "format" TEXT NOT NULL DEFAULT 'regular',
    "imageUrl" TEXT,
    "synopsis" TEXT,
    "review" TEXT,
    "soundtrack" TEXT,
    "overallRating" INTEGER,
    "observations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "universeId" INTEGER,
    "countryId" INTEGER,
    CONSTRAINT "Series_universeId_fkey" FOREIGN KEY ("universeId") REFERENCES "Universe" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Series_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Paso 2: Copiar datos de la tabla original a la nueva
-- Convertir isNovel=1 a basedOn="novela", isNovel=0 a basedOn=NULL
INSERT INTO "Series_new" (
    "id", "title", "originalTitle", "year", "type", "basedOn", "format",
    "imageUrl", "synopsis", "review", "soundtrack", "overallRating",
    "observations", "createdAt", "updatedAt", "universeId", "countryId"
)
SELECT
    "id", "title", "originalTitle", "year", "type",
    CASE WHEN "isNovel" = 1 THEN 'novela' ELSE NULL END as "basedOn",
    'regular' as "format",
    "imageUrl", "synopsis", "review", "soundtrack", "overallRating",
    "observations", "createdAt", "updatedAt", "universeId", "countryId"
FROM "Series";

-- Paso 3: Eliminar tabla original
DROP TABLE "Series";

-- Paso 4: Renombrar tabla nueva
ALTER TABLE "Series_new" RENAME TO "Series";

-- Paso 5: Recrear índices
CREATE UNIQUE INDEX "Series_title_year_key" ON "Series"("title", "year");
