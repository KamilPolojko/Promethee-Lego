# Parametry konfiguracyjne
$BASE_URL = "https://cdn.rebrickable.com/media/downloads"
$TIMESTAMP = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$IMPORT_DIR = Join-Path $PSScriptRoot "import"
$DB_NAME = "lego"
$DB_USER = "postgres"
$DB_PASSWORD = "123"
$PG_HOST = "localhost"
$PG_PORT = 5432

# Set password for PostgreSQL commands
$env:PGPASSWORD = $DB_PASSWORD

# Tworzenie katalogu import, jeśli nie istnieje
if (-not (Test-Path $IMPORT_DIR)) {
    New-Item -ItemType Directory -Force -Path $IMPORT_DIR
}

# Sprawdzanie, czy baza danych już istnieje
$checkDbCmd = psql -h $PG_HOST -U $DB_USER -p $PG_PORT -c "\l" 2>&1
if ($checkDbCmd -notcontains $DB_NAME) {
    psql -h $PG_HOST -U $DB_USER -p $PG_PORT -c "CREATE DATABASE $DB_NAME;"
}

# Kopiowanie i wykonanie schema.sql
psql -h $PG_HOST -U $DB_USER -d $DB_NAME -p $PG_PORT -f "schema.sql"

# Lista plików w prawidłowej kolejności (uwzględniającej zależności)
$FILES = @(
    "part_categories.csv.gz"  # No dependencies
    "colors.csv.gz"          # No dependencies
    "themes.csv.gz"          # Self-referential (parent_id)
    "parts.csv.gz"           # Depends on part_categories
    "sets.csv.gz"            # Depends on themes
    "minifigs.csv.gz"        # No dependencies
    "inventories.csv.gz"     # Depends on sets
    "part_relationships.csv.gz" # Depends on parts
    "elements.csv.gz"        # Depends on parts and colors
    "inventory_parts.csv.gz" # Depends on inventories, parts, colors
    "inventory_sets.csv.gz"  # Depends on inventories, sets
    "inventory_minifigs.csv.gz" # Depends on inventories, minifigs
)

# Add assembly for compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

foreach ($file in $FILES) {
    $table_name = $file -replace "\.csv\.gz$", ""
    $csv_file = $file -replace "\.gz$", ""
    $full_path_gz = Join-Path $IMPORT_DIR $file
    $full_path_csv = Join-Path $IMPORT_DIR $csv_file
    $utf8_csv_file = Join-Path $IMPORT_DIR ("utf8_" + $csv_file)
    
    try {
        # Pobieranie i rozpakowanie pliku
        if (-not (Test-Path $full_path_csv)) {
            Write-Host "Downloading $file..."
            $download_url = "${BASE_URL}/${file}?${TIMESTAMP}"
            Invoke-WebRequest -Uri $download_url -OutFile $full_path_gz -UseBasicParsing
            
            Write-Host "Extracting $file..."
            $input = [System.IO.File]::OpenRead($full_path_gz)
            $output = [System.IO.File]::Create($full_path_csv)
            $gzipStream = New-Object System.IO.Compression.GZipStream($input, [System.IO.Compression.CompressionMode]::Decompress)
            
            try {
                $gzipStream.CopyTo($output)
            }
            finally {
                $gzipStream.Close()
                $output.Close()
                $input.Close()
            }
            
            Remove-Item $full_path_gz
        }

        # Konwersja do UTF-8 z obsługą WIN1250
        if (-not (Test-Path $utf8_csv_file)) {
            Write-Host "Converting $csv_file to UTF-8..."
            $content = [System.IO.File]::ReadAllText($full_path_csv, [System.Text.Encoding]::GetEncoding("Windows-1250"))
            [System.IO.File]::WriteAllText($utf8_csv_file, $content, [System.Text.Encoding]::UTF8)
        }

        # Import do bazy danych z obsługą błędów
        Write-Host "Importing $table_name..."
        $importResult = psql -h $PG_HOST -U $DB_USER -d $DB_NAME -p $PG_PORT -v ON_ERROR_STOP=1 -c "\COPY $table_name FROM '$utf8_csv_file' CSV HEADER;" 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Warning: Import of $table_name failed. Error: $importResult"
        }
    }
    catch {
        Write-Host "Error processing file: $file"
        Write-Host "Error details: $($_.Exception.Message)"
        # Kontynuuj z następnym plikiem
        continue
    }
}

# Czyszczenie plików tymczasowych
Get-ChildItem $IMPORT_DIR -Filter "utf8_*.csv" | Remove-Item

# Tworzenie zrzutu bazy danych
Write-Host "Creating database dump..."
pg_dump -U $DB_USER -h $PG_HOST -p $PG_PORT -Fc $DB_NAME > lego_db_dump.pgdump

Write-Host "Database import and dump complete!"