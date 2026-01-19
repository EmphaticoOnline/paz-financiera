#!/usr/bin/env bash
set -e

# Uso:
#   ./git_push.sh "mensaje del commit"
# Si no pones mensaje, usa uno por defecto.
MSG="${1:-update}"

echo "== git status =="
git status

echo "== git add -A =="
git add -A

echo "== git commit =="
git commit -m "$MSG" || echo "Nada que commitear (sin cambios)."

echo "== git push =="
git push

echo "✅ Listo: enviado a GitHub"
