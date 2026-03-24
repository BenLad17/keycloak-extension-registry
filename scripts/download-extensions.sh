#!/usr/bin/env bash
set -euo pipefail

# download-extensions.sh
#
# Reads a keycloak-extensions.yaml manifest and resolves each listed extension
# (plus its transitive runtime dependencies) into a target directory via Maven.
#
# Usage:
#   ./download-extensions.sh [--manifest <path>] [--target <dir>]
#
# Defaults:
#   --manifest  ./keycloak-extensions.yaml
#   --target    ./providers
#
# Requirements:
#   mvn (Apache Maven 3.x) must be on PATH.
#   See: https://maven.apache.org/install.html

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------

MANIFEST="./keycloak-extensions.yaml"
TARGET="./providers"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --manifest)
      MANIFEST="$2"
      shift 2
      ;;
    --target)
      TARGET="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1"
      echo "Usage: $0 [--manifest <path>] [--target <dir>]"
      exit 1
      ;;
  esac
done

echo "Manifest : $MANIFEST"
echo "Target   : $TARGET"

# ---------------------------------------------------------------------------
# Preflight checks
# ---------------------------------------------------------------------------

if ! command -v mvn &>/dev/null; then
  echo "[ERROR] mvn not found on PATH. Install Maven 3.x and ensure it is in your PATH."
  echo "        See: https://maven.apache.org/install.html"
  exit 1
fi

if [ ! -f "$MANIFEST" ]; then
  echo "[ERROR] Manifest file not found: $MANIFEST"
  exit 1
fi

mkdir -p "$TARGET"

# ---------------------------------------------------------------------------
# YAML parser (stateful awk) + Maven invocation
# ---------------------------------------------------------------------------
#
# Parses entries of the form produced by yamlManifestSnippet, assembled under
# an extensions: top-level key:
#
#   extensions:
#     - groupId: com.example
#       artifactId: my-extension
#       version: 1.2.3
#
# The awk program accumulates groupId/artifactId/version across lines; when all
# three are populated and a new entry begins (or END is reached), it emits one
# colon-delimited coordinate line: groupId:artifactId:version
#

awk '
  # Helper: strip leading/trailing whitespace and return the value after ": "
  function val(line,    idx, v) {
    idx = index(line, ": ")
    if (idx == 0) return ""
    v = substr(line, idx + 2)
    gsub(/^[[:space:]]+|[[:space:]]+$/, "", v)
    return v
  }

  # Helper: emit the current entry if complete
  function emit(    ) {
    if (group_id != "" && artifact_id != "" && ver != "") {
      print group_id ":" artifact_id ":" ver
    }
  }

  BEGIN {
    group_id = ""
    artifact_id = ""
    ver = ""
  }

  /^[[:space:]]*-[[:space:]]+groupId:/ {
    emit()
    group_id = val($0)
    artifact_id = ""
    ver = ""
    next
  }

  /^[[:space:]]+artifactId:/ {
    artifact_id = val($0)
    next
  }

  /^[[:space:]]+version:/ {
    ver = val($0)
    next
  }

  END {
    emit()
  }
' "$MANIFEST" | while IFS=: read -r gid aid ver; do
  echo "Installing: $gid:$aid:$ver"

  POM="/tmp/keycloak-ext-$$.pom"

  cat > "$POM" <<XML
<project>
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.example.downloader</groupId>
  <artifactId>downloader</artifactId>
  <version>1.0</version>
  <packaging>pom</packaging>
  <dependencies>
    <dependency>
      <groupId>${gid}</groupId>
      <artifactId>${aid}</artifactId>
      <version>${ver}</version>
      <scope>runtime</scope>
    </dependency>
  </dependencies>
</project>
XML

  mvn -f "$POM" dependency:copy-dependencies \
    -DoutputDirectory="$(realpath "$TARGET")" \
    -DincludeScope=runtime \
    -q

  rm -f "$POM"
done

echo "Done. Extensions installed to: $TARGET"
