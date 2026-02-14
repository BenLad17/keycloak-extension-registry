#!/bin/bash
# =============================================================================
# Keycloak Extension Manager
# =============================================================================
# Downloads and manages Keycloak extensions from the Extension Registry
#
# Usage:
#   extension-manager install <extensions.yaml>   - Install all extensions
#   extension-manager list                        - List installed extensions
#   extension-manager check-updates               - Check for available updates
#   extension-manager info <extension-name>       - Show extension info
#
# Environment:
#   REGISTRY_URL    - Registry API URL (default: https://registry.keycloak-extensions.org)
#   KC_VERSION      - Keycloak version (auto-detected if not set)
# =============================================================================

set -euo pipefail

REGISTRY_URL="${REGISTRY_URL:-https://registry.keycloak-extensions.org}"
PROVIDERS_DIR="${PROVIDERS_DIR:-/opt/keycloak/providers}"
CACHE_DIR="${CACHE_DIR:-/tmp/extension-cache}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# Helper Functions
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# Detect Keycloak version
detect_kc_version() {
    if [ -n "${KC_VERSION:-}" ]; then
        echo "$KC_VERSION"
        return
    fi

    # Try to detect from kc.sh
    if [ -f /opt/keycloak/bin/kc.sh ]; then
        /opt/keycloak/bin/kc.sh --version 2>/dev/null | grep -oP '\d+\.\d+\.\d+' | head -1 || echo "unknown"
    else
        echo "unknown"
    fi
}

# Parse YAML (basic parser for our simple format)
# Requires: extensions.yaml in specific format
parse_extensions_yaml() {
    local file="$1"

    # Extract extensions list using grep/sed (simple parser)
    # Format: "name:version" per line
    grep -E '^\s+-\s+name:' "$file" -A1 | \
        grep -E '(name:|version:)' | \
        sed 's/.*name:\s*//' | \
        sed 's/.*version:\s*//' | \
        paste - - | \
        tr '\t' ':'
}

# Compare semantic versions
# Returns: 0 if $1 >= $2, 1 otherwise
version_gte() {
    [ "$(printf '%s\n' "$1" "$2" | sort -V | head -n1)" = "$2" ]
}

version_in_range() {
    local version="$1"
    local min="$2"
    local max="$3"

    version_gte "$version" "$min" && version_gte "$max" "$version"
}

# Calculate SHA256 checksum
calculate_sha256() {
    local file="$1"
    sha256sum "$file" | cut -d' ' -f1
}

# =============================================================================
# Registry API Functions
# =============================================================================

# Fetch extension metadata from registry
fetch_extension_metadata() {
    local name="$1"
    curl -sf "${REGISTRY_URL}/api/extensions/${name}" || {
        log_error "Failed to fetch metadata for ${name}"
        return 1
    }
}

# Find best compatible version for current Keycloak
find_compatible_version() {
    local metadata="$1"
    local kc_version="$2"
    local requested_version="$3"

    if [ "$requested_version" != "latest" ]; then
        # Check if requested version is compatible
        local compat=$(echo "$metadata" | jq -r ".versions[\"${requested_version}\"].keycloakCompatibility // empty")
        if [ -n "$compat" ]; then
            local min=$(echo "$compat" | jq -r '.min')
            local max=$(echo "$compat" | jq -r '.max')

            if version_in_range "$kc_version" "$min" "$max"; then
                echo "$requested_version"
                return 0
            else
                log_error "Version ${requested_version} is not compatible with Keycloak ${kc_version} (requires ${min}-${max})"
                return 1
            fi
        fi
    fi

    # Find latest compatible version
    echo "$metadata" | jq -r --arg kc "$kc_version" '
        .versions | to_entries | map(select(
            .value.keycloakCompatibility.min <= $kc and
            .value.keycloakCompatibility.max >= $kc
        )) | sort_by(.value.publishedAt) | reverse | .[0].key // empty
    '
}

# =============================================================================
# Commands
# =============================================================================

cmd_install() {
    local config_file="${1:-extensions.yaml}"

    if [ ! -f "$config_file" ]; then
        log_error "Config file not found: ${config_file}"
        exit 1
    fi

    log_info "Installing extensions from ${config_file}"

    # Detect Keycloak version
    local kc_version=$(detect_kc_version)
    log_info "Detected Keycloak version: ${kc_version}"

    # Create directories
    mkdir -p "$PROVIDERS_DIR"
    mkdir -p "$CACHE_DIR"

    # Parse extensions from YAML
    local extensions=$(parse_extensions_yaml "$config_file")

    if [ -z "$extensions" ]; then
        log_warn "No extensions found in ${config_file}"
        exit 0
    fi

    local failed=0

    while IFS=':' read -r name version; do
        [ -z "$name" ] && continue

        log_info "Processing: ${name}@${version}"

        # Fetch metadata from registry
        local metadata=$(fetch_extension_metadata "$name") || {
            log_error "Failed to fetch ${name}"
            failed=$((failed + 1))
            continue
        }

        # Find compatible version
        local resolved_version=$(find_compatible_version "$metadata" "$kc_version" "$version")

        if [ -z "$resolved_version" ]; then
            log_error "No compatible version found for ${name} with Keycloak ${kc_version}"
            failed=$((failed + 1))
            continue
        fi

        log_info "Resolved version: ${resolved_version}"

        # Get download info
        local jar_url=$(echo "$metadata" | jq -r ".versions[\"${resolved_version}\"].jarUrl")
        local expected_sha256=$(echo "$metadata" | jq -r ".versions[\"${resolved_version}\"].sha256")

        if [ -z "$jar_url" ] || [ "$jar_url" = "null" ]; then
            log_error "No download URL for ${name}@${resolved_version}"
            failed=$((failed + 1))
            continue
        fi

        # Download JAR
        local jar_file="${PROVIDERS_DIR}/${name}-${resolved_version}.jar"
        local cache_file="${CACHE_DIR}/${name}-${resolved_version}.jar"

        if [ -f "$cache_file" ]; then
            log_info "Using cached: ${cache_file}"
            cp "$cache_file" "$jar_file"
        else
            log_info "Downloading: ${jar_url}"
            curl -sfL "$jar_url" -o "$jar_file" || {
                log_error "Failed to download ${name}"
                failed=$((failed + 1))
                continue
            }

            # Cache for future use
            cp "$jar_file" "$cache_file" 2>/dev/null || true
        fi

        # Verify checksum
        if [ -n "$expected_sha256" ] && [ "$expected_sha256" != "null" ]; then
            local actual_sha256=$(calculate_sha256 "$jar_file")
            if [ "$actual_sha256" != "$expected_sha256" ]; then
                log_error "Checksum mismatch for ${name}!"
                log_error "  Expected: ${expected_sha256}"
                log_error "  Actual:   ${actual_sha256}"
                rm -f "$jar_file"
                failed=$((failed + 1))
                continue
            fi
            log_success "Checksum verified"
        else
            log_warn "No checksum available, skipping verification"
        fi

        log_success "Installed: ${name}@${resolved_version}"

    done <<< "$extensions"

    if [ $failed -gt 0 ]; then
        log_error "${failed} extension(s) failed to install"
        exit 1
    fi

    log_success "All extensions installed successfully"
}

cmd_list() {
    log_info "Installed extensions in ${PROVIDERS_DIR}:"

    if [ -d "$PROVIDERS_DIR" ]; then
        ls -la "$PROVIDERS_DIR"/*.jar 2>/dev/null || echo "  (none)"
    else
        echo "  (providers directory not found)"
    fi
}

cmd_check_updates() {
    local config_file="${1:-/opt/keycloak/extensions.yaml}"

    if [ ! -f "$config_file" ]; then
        log_error "Config file not found: ${config_file}"
        exit 1
    fi

    local kc_version=$(detect_kc_version)
    log_info "Checking for updates (Keycloak ${kc_version})"

    local extensions=$(parse_extensions_yaml "$config_file")

    while IFS=':' read -r name version; do
        [ -z "$name" ] && continue

        local metadata=$(fetch_extension_metadata "$name" 2>/dev/null) || continue
        local latest=$(find_compatible_version "$metadata" "$kc_version" "latest")

        if [ -n "$latest" ] && [ "$latest" != "$version" ]; then
            echo -e "${YELLOW}⬆${NC} ${name}: ${version} → ${latest}"
        else
            echo -e "${GREEN}✓${NC} ${name}: ${version} (up to date)"
        fi

    done <<< "$extensions"
}

cmd_info() {
    local name="$1"

    if [ -z "$name" ]; then
        log_error "Usage: extension-manager info <extension-name>"
        exit 1
    fi

    local metadata=$(fetch_extension_metadata "$name") || exit 1

    echo "$metadata" | jq '.'
}

cmd_help() {
    cat << EOF
Keycloak Extension Manager

Usage:
  extension-manager <command> [arguments]

Commands:
  install [config.yaml]    Install extensions from config file
  list                     List installed extensions
  check-updates [config]   Check for available updates
  info <name>              Show extension info from registry
  help                     Show this help message

Environment Variables:
  REGISTRY_URL    Registry API URL (default: https://registry.keycloak-extensions.org)
  KC_VERSION      Keycloak version (auto-detected if not set)
  PROVIDERS_DIR   Providers directory (default: /opt/keycloak/providers)

Examples:
  extension-manager install extensions.yaml
  extension-manager check-updates
  extension-manager info keycloak-metrics-spi

EOF
}

# =============================================================================
# Main
# =============================================================================

main() {
    local command="${1:-help}"
    shift || true

    case "$command" in
        install)
            cmd_install "$@"
            ;;
        list)
            cmd_list
            ;;
        check-updates)
            cmd_check_updates "$@"
            ;;
        info)
            cmd_info "$@"
            ;;
        help|--help|-h)
            cmd_help
            ;;
        *)
            log_error "Unknown command: ${command}"
            cmd_help
            exit 1
            ;;
    esac
}

main "$@"

