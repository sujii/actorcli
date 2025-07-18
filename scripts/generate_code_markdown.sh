#!/bin/bash

set -euo pipefail

OUTPUT_FILE="project_code.md"
MAX_FILE_SIZE=524288 # 512KB

# Mapping: file extensions → markdown language identifier
declare -A FILE_LANG_MAP=(
  [sh]="sh"
  [js]="javascript"
  [ts]="typescript"
  [tsx]="typescriptreact"
  [html]="html"
  [json]="json"
  [yml]="yaml"
  [md]="markdown"
  [cjs]="javascript"
  [mjs]="javascript"
  [vimrc]="vim"
  [zshrc]="zsh"
  [conf]="conf"
  [toml]="toml"
  [txt]="text"
)

# Mapping: filename (no extension) → language
declare -A FILE_NAME_MAP=(
  [.bashrc]="bash"
  [.zshrc]="zsh"
  [.env]="dotenv"
  [.gitignore]="gitignore"
  [Dockerfile]="dockerfile"
  [Makefile]="makefile"
)

EXCLUDE_DIRS=("node_modules" ".git" "dev" ".yarn" ".turbo" "dist" "backup" "_vim/doc")
EXCLUDE_PATHS=("$OUTPUT_FILE" ".pnp.*" "package-lock.json" "yarn.lock" "bun.lockb" "Brewfile.lock.json")

initialize_output() {
  {
    echo "# Project Code Documentation"
    echo
    echo "Generated on $(date -Iseconds)"
    echo
    echo "## Table of Contents"
    echo
  } > "$OUTPUT_FILE"
}

get_lang_identifier() {
  local filename="$1"
  local base="${filename##*/}"
  local ext="${filename##*.}"

  if [[ -n "${FILE_NAME_MAP[$base]:-}" ]]; then
    echo "${FILE_NAME_MAP[$base]}"
  elif [[ "$ext" == "$base" ]]; then
    echo "text"
  elif [[ -n "${FILE_LANG_MAP[$ext]:-}" ]]; then
    echo "${FILE_LANG_MAP[$ext]}"
  else
    echo "text"
  fi
}

add_file_contents_and_index() {
  local find_args=()
  for ext in "${!FILE_LANG_MAP[@]}"; do
    find_args+=("-name" "*.$ext" "-o")
  done
  find_args+=("-name" ".*rc" "-o" "-name" "Dockerfile" "-o" "-name" "Makefile" "-o")
  unset 'find_args[${#find_args[@]}-1]'

  local exclude_args=()
  for dir in "${EXCLUDE_DIRS[@]}"; do
    exclude_args+=("!" "-path" "*/$dir/*")
  done
  for path in "${EXCLUDE_PATHS[@]}"; do
    exclude_args+=("!" "-name" "$path")
  done

  find . -type f \( "${find_args[@]}" \) "${exclude_args[@]}" | sort | while IFS= read -r file; do
    local rel="${file#./}"
    local anchor=$(echo "$rel" | sed -E 's/[^a-zA-Z0-9_]/-/g' | tr '[:upper:]' '[:lower:]')
    local size=$(stat -c%s "$file" 2>/dev/null || echo 0)
    local lang=$(get_lang_identifier "$file")

    echo "- [\`$rel\`](#$anchor)" >> "$OUTPUT_FILE"
    {
      echo
      echo "---"
      echo "## <a id=\"$anchor\"></a> \`$rel\`"
      if (( size > MAX_FILE_SIZE )); then
        echo "*Warning: File size $size exceeds limit ($MAX_FILE_SIZE). Output may be truncated.*"
      fi
      echo "\`\`\`$lang"
      cat "$file"
      echo "\`\`\`"
      echo
    } >> "$OUTPUT_FILE" || echo "⚠️ Failed: $file"
  done
}

# Main
echo "Exporting project to Markdown..."
initialize_output
add_file_contents_and_index
echo "Done → $OUTPUT_FILE"
