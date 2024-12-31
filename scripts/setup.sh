#!/usr/bin/env bash

# Exit on error, undefined variables, and pipe failures
set -euo pipefail

# Function for logging with timestamp
log() {
    echo "⌁ 🛼 ⌁ [$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

# Function for error handling with more detailed output
handle_error() {
    local line_no="$1"
    local command="$2"
    log "Error occurred at line ${line_no}"
    log "Failed command: ${command}"
    exit 1
}

# Cleanup function
cleanup() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        log "Script exited with error code $exit_code"
    fi
    # Add any cleanup tasks here
    exit $exit_code
}

# Set up error trap with last command
trap 'handle_error ${LINENO} "${BASH_COMMAND}"' ERR
trap cleanup EXIT

# Check for required commands
check_requirements() {
    local missing_commands=()
    local required_commands=("corepack" "yarn" "tree")

    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            missing_commands+=("$cmd")
        fi
    done

    if [ ${#missing_commands[@]} -ne 0 ]; then
        log "Error: The following required commands are missing:"
        printf '%s\n' "${missing_commands[@]}"
        return 1
    fi
}

# Function to handle yarn operations
setup_yarn() {
    log "Initializing Yarn"
    if ! yarn init -2; then
        log "Failed to initialize yarn"
        return 1
    fi

    log "Setting Yarn version"
    if ! yarn set version stable; then
        log "Failed to set yarn version"
        return 1
    fi

    if ! yarn plugin import interactive-tools; then
        log "Failed to import interactive-tools plugin"
        return 1
    fi

    if ! yarn plugin import version; then
        log "Failed to import version plugin"
        return 1
    fi

    # recover package.json
    if ! git checkout package.json; then
        log "Failed to recover package.json"
        log "Please Fix package.json: $ git checkout package.json"
        return 1
    fi

    log "Setting up dependencies"
    if ! yarn install; then
        log "Failed to install dependencies"
        return 1
    fi
}

main() {
    log "Running: Setup Workspace ⌁ 🧊"

    # Check requirements first
    if ! check_requirements; then
        log "Requirements check failed"
        exit 1
    fi

    # Enable corepack
    log "Enabling corepack"
    if ! corepack enable; then
        log "Failed to enable corepack"
        exit 1
    fi

    # Setup yarn and handle potential errors
    if ! setup_yarn; then
        log "Failed to setup yarn environment"
        exit 1
    fi

    # Run tree command with error handling
    if ! tree -L 3; then
        log "Failed to display directory structure"
    fi

    if ! yarn build; then
        log "Failed to build project"
        exit 1
    fi

    log "Finished: Setup Workspace ⌁ ⚡️"

    if ! sh alias --add actor "yarn actor"; then
        log "Failed to add actor alias"
        exit 1
    fi

    log "Type '$ actor --help' to see available commands and options 👋"

    echo
}

# Run main function
main

exit 0
