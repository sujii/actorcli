#!/bin/bash

# Exit on error, undefined variables, and pipe failures
set -euo pipefail

# === 定数定義 ===

# Output file name
OUTPUT_FILE="project_code_for_gemini.md"

# Target file extensions and their corresponding Markdown code block language identifiers
# ここを具体的に記述することで、Geminiが正確なシンタックスハイライトを適用できる
# 例: "sh", "javascript", "typescript", "json", "yaml", "markdown", "vim", "zsh", "toml", "conf"
declare -A FILE_LANG_MAP=(
    ["sh"]="sh"
    ["js"]="javascript"
    ["ts"]="typescript"
    ["html"]="html"
    ["json"]="json"
    ["yml"]="yaml"
    ["tsx"]="typescriptreact" # React TypeScript
    ["md"]="markdown"
    ["cjs"]="javascript"
    ["mjs"]="javascript"
    ["vimrc"]="vim" # Vimの設定ファイル
    ["zshrc"]="zsh" # Zshの設定ファイル
    ["conf"]="conf" # 一般的な設定ファイル (例: Nginx, Git config)
    ["toml"]="toml" # TOML形式の設定ファイル (例: Alacritty)
    ["txt"]="text" # プレーンテキスト（ドキュメントなど）
    # [""]="" # 拡張子なしのファイル (例: Dockerfile, Makefileなど、適切なシンタックス指定がない場合は空にする)
    # ↑この行がエラーの原因だったわ。Bashの連想配列は空文字列をキーにできないため削除するわ。
)

# Directories to exclude
EXCLUDE_DIR=(
    "node_modules"
    ".git"
    "dev"
    ".yarn"
    ".turbo"
    "dist"
    "backup" # バックアップディレクトリも除外対象に追加
    "_vim/doc" # ドキュメントは基本的に手動で指定し、Geminiへの情報量をコントロールする
)

# Paths to exclude (ファイル名全体または特定のパス)
EXCLUDE_PATH=(
    "$OUTPUT_FILE"
    ".pnp.*"
    "package-lock.json" # 通常、Geminiに直接解析させる必要がないことが多い
    "yarn.lock"         # 同上
    "bun.lockb"         # 同上
    "Brewfile.lock.json" # 同上
    # "*.log"             # 必要に応じてログファイルも除外
)

# ファイルサイズの上限 (バイト単位)。このサイズを超えると警告を出す、または抜粋する
# 例: 1MB = 1024 * 1024
# MAX_FILE_SIZE=1048576
MAX_FILE_SIZE=524288 # 512KBに設定。Geminiの入力制限を考慮し、大きすぎるファイルは避ける

# === 関数定義 ===

# Initialize output file
initialize_output() {
    {
        echo "# Project Code Documentation for Gemini"
        echo
        echo "Generated on $(date '+%Y-%m-%dT%H:%M:%S.%6N%z')" # ISO 8601 format
        echo
        echo "## 目次とファイル内容" # 目次セクションの明確化
        echo
    } > "$OUTPUT_FILE" || { echo "Failed to initialize output file."; exit 1; }
}

# Get the markdown language identifier based on file extension
get_lang_identifier() {
    local filename="$1"
    local ext="${filename##*.}" # 拡張子を取得
    local base_name="${filename##*/}" # ファイル名のみを取得 (拡張子なしの場合に対応)

    # 拡張子がない場合（例: Dockerfile, Makefile, .bashrc など）
    # まず、ファイル名全体で特殊なパターンをチェック
    case "$base_name" in
        .vimrc) echo "vim"; return ;;
        .zshrc) echo "zsh"; return ;;
        Dockerfile) echo "dockerfile"; return ;;
        Makefile) echo "makefile"; return ;;
        # 拡張子がない他のファイル（例: .env, .gitconfig など）は 'text' と扱う
        # ここでは空のext変数でなく、base_nameに'.'が含まれない場合、かつ特殊ファイルではない場合
        # といったより具体的な条件で判断することも可能。今回はシンプルに。
    esac

    # ext変数がファイル名と一致する場合 (つまり拡張子がない場合)
    if [[ "$ext" == "$base_name" ]]; then
        echo "text" # 拡張子がない場合はプレーンテキストとして扱う
        return
    fi

    # mapに登録された拡張子を優先
    if [[ -n "${FILE_LANG_MAP[$ext]}" ]]; then
        echo "${FILE_LANG_MAP[$ext]}"
    else
        echo "text" # 認識できない拡張子はプレーンテキストとして扱う
    fi
}

# Add file content with full path headings and enhanced formatting
add_file_contents_and_index() {
    # 動的に `find` コマンドの条件を生成
    FIND_NAME_CONDITIONS=()
    for ext in "${!FILE_LANG_MAP[@]}"; do
        if [[ -n "$ext" ]]; then # 空の拡張子キーは存在しないので安全
            FIND_NAME_CONDITIONS+=("-name" "*.$ext" "-o")
        fi
    done
    # 特定の隠しファイル（拡張子なし）
    FIND_NAME_CONDITIONS+=("-name" ".*rc" "-o" "-name" "Dockerfile" "-o" "-name" "Makefile" "-o" "-name" ".*" "-o") # ドットファイル全般を捕捉
    # 最後の `-o` を削除
    unset 'FIND_NAME_CONDITIONS[${#FIND_NAME_CONDITIONS[@]}-1]'


    FIND_EXCLUDE_CONDITIONS=()
    for excl_dir in "${EXCLUDE_DIR[@]}"; do
        FIND_EXCLUDE_CONDITIONS+=("!" "-path" "*/$excl_dir/*")
    done
    for excl_path in "${EXCLUDE_PATH[@]}"; do
        # EXCLUDE_PATHがファイル名全体の場合に対応するため -name を使用
        # ファイルパスのパターン (`*` を含む場合など) と完全一致するファイル名パターンを区別
        if [[ "$excl_path" == *\/ || "$excl_path" == ".*" ]]; then # パス形式か隠しファイル形式
             FIND_EXCLUDE_CONDITIONS+=("!" "-path" "$excl_path")
        elif [[ "$excl_path" == *"*"* || "$excl_path" == *"."* ]]; then # ワイルドカードやドットを含むファイル名パターン
            FIND_EXCLUDE_CONDITIONS+=("!" "-name" "$excl_path")
        else # 完全一致のファイル名
             FIND_EXCLUDE_CONDITIONS+=("!" "-name" "$excl_path")
        fi
    done

    # Find commandでファイルリストを生成し、ソートしてから処理
    find . -type f \( "${FIND_NAME_CONDITIONS[@]}" \) "${FIND_EXCLUDE_CONDITIONS[@]}" | sort | while IFS= read -r FILE; do
        # カレントディレクトリからの相対パスに変換 (./を削除)
        DISPLAY_FILE_PATH="${FILE#./}"

        # ファイルパスをアンカー形式に変換（MarkdownのリンクとIDのため）
        FILE_ANCHOR=$(echo "$DISPLAY_FILE_PATH" | sed -E 's/[^a-zA-Z0-9_]/-/g' | tr '[:upper:]' '[:lower:]')

        # === 目次への追加 ===
        echo "- [\`$DISPLAY_FILE_PATH\`](#$FILE_ANCHOR)" >> "$OUTPUT_FILE"

        # === ファイル内容の追加 ===
        echo >> "$OUTPUT_FILE"
        echo "---" >> "$OUTPUT_FILE"
        echo "## <a id=\"${FILE_ANCHOR}\"></a> \`$DISPLAY_FILE_PATH\`" >> "$OUTPUT_FILE"

        # ファイルサイズのチェック (必要に応じて抜粋機能を追加)
        FILE_SIZE=$(stat -c%s "$FILE" 2>/dev/null || echo 0)
        if (( FILE_SIZE > MAX_FILE_SIZE )); then
            echo "*ファイルサイズが ${FILE_SIZE} バイトで、設定された上限 (${MAX_FILE_SIZE} バイト) を超えています。内容は省略されるか、一部のみ表示されます。*" >> "$OUTPUT_FILE"
        fi

        # コードブロックの言語識別子を取得
        LANG_IDENTIFIER=$(get_lang_identifier "$FILE")

        echo "\`\`\`$LANG_IDENTIFIER" >> "$OUTPUT_FILE"
        cat "$FILE" >> "$OUTPUT_FILE" || { echo "Failed to read file content for $FILE."; continue; }
        echo "\`\`\`" >> "$OUTPUT_FILE"
        echo >> "$OUTPUT_FILE"
    done || { echo "Failed to generate file contents."; exit 1; }
}


# === メイン処理 ===

echo "Generating Markdown document with all project code for Gemini..."

# Initialize output file
initialize_output

# Add file content and Table of Index together for better control over output
add_file_contents_and_index

echo "Markdown document generated: $OUTPUT_FILE"
