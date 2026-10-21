#!/usr/bin/env bash
# Packages the theme and plugin as zips that WordPress's own upload screens
# accept (Plugins → Add New → Upload, Appearance → Themes → Upload), for a host
# the deploy workflow cannot reach.
#
#   wordpress/bin/build-zips.sh [output-dir]
set -euo pipefail
here="$(cd "$(dirname "$0")/.." && pwd)"
out="$(mkdir -p "${1:-$here/dist}" && cd "${1:-$here/dist}" && pwd)"
(cd "$here/plugin" && rm -f "$out/yard-systems.zip" && zip -qr "$out/yard-systems.zip" yard-systems)
(cd "$here/theme" && rm -f "$out/working-yard.zip" && zip -qr "$out/working-yard.zip" working-yard)
ls -l "$out"/*.zip
