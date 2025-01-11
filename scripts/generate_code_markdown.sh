#!/bin/bash

# Output file name
OUTPUT_FILE="project_code.md"
# Target file extensions
EXTENSIONS=("js" "css" "html" "json" "sh" "ts" "yml" "tsx" "md")

# Initialize output file
{
    echo "# Project Code Documentation"
    echo
    echo "Generated on $(date '+%Y-%m-%dT%H:%M:%S.%6N%z')" # ISO 8601 format
    echo
} > "$OUTPUT_FILE"

# Generate Directives Structure
generate_directives() {
    echo "## Directives Structure" >> "$OUTPUT_FILE"
    echo '```' >> "$OUTPUT_FILE"
    # Use tree command to generate directory structure, excluding node_modules
    tree -I 'node_modules' --noreport >> "$OUTPUT_FILE"
    echo '```' >> "$OUTPUT_FILE"
    echo >> "$OUTPUT_FILE"
}

# Generate Table of Index
generate_table_of_index() {
    echo "## Table of Index" >> "$OUTPUT_FILE"
    echo >> "$OUTPUT_FILE"
    # List files matching the target extensions, excluding node_modules
    find . -type f \( -name "*.js" -o -name "*.css" -o -name "*.html" -o -name "*.json" -o -name "*.sh" -o -name "*.ts" -o -name "*.tsx" -o -name "*.yml" -o -name "*.md" \) ! -path "*/node_modules/*" ! -path "*/.git/*" ! -name "$OUTPUT_FILE" | while IFS= read -r FILE; do
        FILE_ANCHOR=$(echo "$FILE" | sed -E 's/[^a-zA-Z0-9]/-/g' | tr '[:upper:]' '[:lower:]')
        echo "- [\`$FILE\`](#$FILE_ANCHOR)" >> "$OUTPUT_FILE"
    done
    echo >> "$OUTPUT_FILE"
}

# Add file content with full path headings
add_file_contents() {
    find . -type f \( -name "*.js" -o -name "*.css" -o -name "*.html" -o -name "*.json" -o -name "*.sh" -o -name "*.ts" -o -name "*.tsx" -o -name "*.yml" -o -name "*.md" \) ! -path "*/node_modules/*" ! -path "*/.git/*" ! -name "$OUTPUT_FILE" | while IFS= read -r FILE; do
        EXT="${FILE##*.}"
        FILE_ANCHOR=$(echo "$FILE" | sed -E 's/[^a-zA-Z0-9]/-/g' | tr '[:upper:]' '[:lower:]')
        {
            echo "## <a id=\"$FILE_ANCHOR\"></a> $FILE" # Include full path with anchor ID
            echo "\`\`\`$EXT"
            cat "$FILE"
            echo "\`\`\`"
            echo
        } >> "$OUTPUT_FILE"
    done
}

echo "Generating Markdown document with all project code..."

# Add directives structure
generate_directives

# Add Table of Index
generate_table_of_index

# Add file content
add_file_contents

echo "Markdown document generated: $OUTPUT_FILE"
