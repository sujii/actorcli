#!/usr/bin/env bash

# Exit on error, undefined variables, and pipe failures
set -euo pipefail

# Function for logging with timestamp
log() {
    echo "⌁ 🛼 ⌁ [$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function for error handling with more detailed output
handle_error() {
    local line_no=$1
    local command=$2
    log "Error occurred at line ${line_no}"
    log "Failed command: ${command}"
    exit 1
}

# Set up error trap with last command
trap 'handle_error ${LINENO} "${BASH_COMMAND}"' ERR

# Check for required commands
check_requirements() {
    local required_commands=("corepack" "yarn" "tree")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            log "Error: ${cmd} is not installed"
            exit 1
        fi
		done
}

# Function to handle yarn operations
setup_yarn() {
    log "Initializing Yarn"
    yarn init -2 || return 1

    log "Setting Yarn version"
    yarn set version stable || return 1

    yarn plugin import interactive-tools
    yarn plugin import version

    # recover package.json
    if ! git checkout package.json; then
        log "Failed to recover package.json"
        log "Please Fix package.json: $ git checkout package.json"
        exit 1
    fi

    log "Setting up dependencies"
    yarn install || return 1
}

main() {
    log "Running: Setup Workspace ⌁ 🧊"

    # Check requirements first
    check_requirements

    # Enable corepack
    log "Enabling corepack"
    corepack enable || {
        log "Failed to enable corepack"
        exit 1
    }

    # Setup yarn and handle potential errors
    setup_yarn || {
        log "Failed to setup yarn environment"
        exit 1
    }

    # Run tree command with error handling
    if ! tree -L 3; then
        log "Failed to display directory structure"
    fi

    yarn build || {
        log "Failed to build project"
        exit 1
    }

    log "Finished: Setup Workspace ⌁ ⚡️"

    sh alias --add actor "yarn actor"

    log "Type '$ actor --help' to see available commands and options 👋"

    echo
}

# Run main function
main

exit 0
