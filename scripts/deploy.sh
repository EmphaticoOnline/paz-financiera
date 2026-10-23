#!/usr/bin/env bash
# Deploy de Paz Financiera: compila, respalda y publica por SSH/rsync.
# Uso: npm run deploy        (despliega)
#      npm run deploy:check  (solo compila y verifica en local; no toca el servidor)
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_DIR="$ROOT_DIR/backend"

SERVER="${SSH_SERVER:-ubuntu@148.113.192.7}"
REMOTE_PATH="/var/www/paz-financiera"
PM2_NAME="paz-financiera-api"
PUBLIC_URL="${PUBLIC_URL:-https://paz-financiera.emphasys.cloud}"
CHECK_ONLY="${CHECK_ONLY:-false}"
BUILD_ID="$(date -u +%Y%m%d-%H%M%S)"

SSH_OPTS=(-o BatchMode=yes -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new)
# Sin -t/-p/-o/-g: backend/dist del servidor tiene subdirectorios de root.
RSYNC_FLAGS=(-rlz --checksum --no-perms --no-owner --no-group)
RSYNC_SSH="ssh ${SSH_OPTS[*]}"

log() { echo "==> $*"; }
fail() { echo "ERROR: $*" >&2; exit 1; }
trap 'echo "ERROR: el deploy se detuvo en la línea $LINENO (comando: $BASH_COMMAND)" >&2' ERR

remote() { ssh "${SSH_OPTS[@]}" "$SERVER" "$@"; }

# ---------------------------------------------------------------- 1. Previos
command -v node >/dev/null || fail "node no está instalado."
command -v curl >/dev/null || fail "curl no está instalado."
if [[ "$CHECK_ONLY" != "true" ]]; then
  command -v rsync >/dev/null || fail "rsync no está instalado."
  log "Verificando acceso SSH a $SERVER..."
  remote "test -d '$REMOTE_PATH/frontend' && test -d '$REMOTE_PATH/backend/dist' && command -v pm2 >/dev/null" \
    || fail "No hay acceso SSH o faltan $REMOTE_PATH/{frontend,backend/dist} / pm2 en el servidor."
fi

# ---------------------------------------------------------------- 2. Build
for dir in "$FRONTEND_DIR" "$BACKEND_DIR"; do
  [[ -d "$dir/node_modules" ]] || { log "Instalando dependencias en $(basename "$dir")..."; (cd "$dir" && npm ci); }
done

log "Compilando frontend..."
(cd "$FRONTEND_DIR" && rm -rf dist && npm run build)

log "Compilando backend..."
(cd "$BACKEND_DIR" && rm -rf dist && npm run build)

# ------------------------------------------- 3. Frontend de producción usa /api
log "Verificando que el frontend de producción use /api..."
[[ -f "$FRONTEND_DIR/.env.production" ]] || fail "Falta frontend/.env.production."
prod_api="$(grep -E '^VITE_API_URL=' "$FRONTEND_DIR/.env.production" | tail -1 | cut -d= -f2- | tr -d '\r"'"'"' ')"
[[ "$prod_api" == "/api" ]] || fail "frontend/.env.production define VITE_API_URL='$prod_api'; debe ser '/api'."
# Una .env.local o variable de entorno podrían imponerse sobre .env.production,
# así que lo que cuenta es el bundle ya compilado.
if grep -rEl 'localhost:[0-9]+|148\.113\.192\.7|http://[^"'"'"' ]*:4000' "$FRONTEND_DIR/dist/assets" >/dev/null 2>&1; then
  grep -rEo 'localhost:[0-9]+|148\.113\.192\.7|http://[^"'"'"' ]*:4000' "$FRONTEND_DIR/dist/assets" | sort -u >&2
  fail "El bundle del frontend contiene URLs absolutas de desarrollo en lugar de /api."
fi
grep -rqF '/api/' "$FRONTEND_DIR/dist/assets" 2>/dev/null \
  || grep -rqE '"/api"|`/api|/api`' "$FRONTEND_DIR/dist/assets" 2>/dev/null \
  || fail "El bundle del frontend no referencia /api."
[[ -f "$FRONTEND_DIR/dist/index.html" ]] || fail "No se generó frontend/dist/index.html."
[[ -f "$BACKEND_DIR/dist/index.js" ]] || fail "No se generó backend/dist/index.js."

if [[ "$CHECK_ONLY" == "true" ]]; then
  log "Verificación local correcta (CHECK_ONLY=true): no se tocó el servidor."
  exit 0
fi

# ----------------------------------------------------------------- 4. Respaldo
BACKUP_DIR="$REMOTE_PATH/backups/$BUILD_ID"
log "Respaldando artefactos actuales en $BACKUP_DIR..."
remote "set -e; mkdir -p '$BACKUP_DIR' \
  && tar -czf '$BACKUP_DIR/frontend.tar.gz' -C '$REMOTE_PATH' frontend \
  && tar -czf '$BACKUP_DIR/backend.tar.gz' -C '$REMOTE_PATH/backend' dist \
  && test -s '$BACKUP_DIR/frontend.tar.gz' && test -s '$BACKUP_DIR/backend.tar.gz'"

# --------------------------------------------------------------- 5. Publicar
# --delete solo en frontend/assets/ y backend/dist/ (únicamente artefactos de build).
log "Detectando cambios en el backend..."
backend_changes="$(rsync "${RSYNC_FLAGS[@]}" --delete --dry-run --itemize-changes -e "$RSYNC_SSH" \
  "$BACKEND_DIR/dist/" "$SERVER:$REMOTE_PATH/backend/dist/" | grep -vE '^\.d' || true)"

# frontend/ puede contener archivos ajenos al build (fuente, .env, .git...):
# la raíz se sincroniza SIN --delete y solo assets/ (salida de Vite) lo usa.
log "Publicando frontend..."
rsync "${RSYNC_FLAGS[@]}" --exclude='/assets/' -e "$RSYNC_SSH" "$FRONTEND_DIR/dist/" "$SERVER:$REMOTE_PATH/frontend/"
rsync "${RSYNC_FLAGS[@]}" --delete -e "$RSYNC_SSH" "$FRONTEND_DIR/dist/assets/" "$SERVER:$REMOTE_PATH/frontend/assets/"

if [[ -n "$backend_changes" ]]; then
  log "Publicando backend/dist..."
  rsync "${RSYNC_FLAGS[@]}" --delete -e "$RSYNC_SSH" "$BACKEND_DIR/dist/" "$SERVER:$REMOTE_PATH/backend/dist/"
else
  log "Backend sin cambios: se omite publicación y reinicio."
fi

# Las dependencias no se instalan en automático: avisa si el lock difiere.
local_lock="$(shasum -a 256 "$BACKEND_DIR/package-lock.json" | cut -d' ' -f1)"
remote_lock="$(remote "sha256sum '$REMOTE_PATH/backend/package-lock.json' 2>/dev/null | cut -d' ' -f1" || true)"
if [[ "$local_lock" != "$remote_lock" ]]; then
  echo "AVISO: backend/package-lock.json difiere del servidor; este deploy no instala dependencias." >&2
fi

# ----------------------------------------------------------------- 6. Reinicio
rollback() {
  echo "Restaurando respaldo $BUILD_ID..." >&2
  remote "set -e; rm -rf '$REMOTE_PATH/backend/dist'/* \
    && tar -xzf '$BACKUP_DIR/backend.tar.gz' -C '$REMOTE_PATH/backend' \
    && tar -xzf '$BACKUP_DIR/frontend.tar.gz' -C '$REMOTE_PATH' \
    && pm2 restart '$PM2_NAME' --update-env" >&2 \
    && echo "Respaldo restaurado y $PM2_NAME reiniciado." >&2 \
    || echo "FALLÓ la restauración automática; respaldo en $BACKUP_DIR del servidor." >&2
}

if [[ -n "$backend_changes" ]]; then
  log "Reiniciando $PM2_NAME..."
  if ! remote "pm2 restart '$PM2_NAME' --update-env && pm2 save >/dev/null"; then
    rollback
    fail "pm2 no pudo reiniciar $PM2_NAME."
  fi
fi

# ------------------------------------------------------------ 7. Verificación
verify_failed=""
check_url() { # url, descripción, patrón opcional en el cuerpo
  local body code i
  for i in 1 2 3 4 5 6; do
    code="$(curl -s -o /tmp/paz-deploy-body.$$ -w '%{http_code}' --max-time 10 "$1" || true)"
    if [[ "$code" == "200" ]] && { [[ -z "${3:-}" ]] || grep -qE "$3" /tmp/paz-deploy-body.$$; }; then
      rm -f /tmp/paz-deploy-body.$$; echo "    OK  $2 ($1)"; return 0
    fi
    sleep 2
  done
  rm -f /tmp/paz-deploy-body.$$
  echo "    FALLO  $2 ($1) -> HTTP $code" >&2
  return 1
}

log "Verificando frontend y API..."
asset="$(grep -oE 'assets/[^"]+\.js' "$FRONTEND_DIR/dist/index.html" | head -1)"
check_url "$PUBLIC_URL/" "frontend (index.html)" '<div id="root"' || verify_failed=1
[[ -n "$asset" ]] && { check_url "$PUBLIC_URL/$asset" "bundle JS publicado" || verify_failed=1; }
check_url "$PUBLIC_URL/api/tarjetas" "API vía Nginx /api" '^\s*[\[{]' || verify_failed=1
remote "curl -fsS --max-time 10 http://127.0.0.1:4000/ >/dev/null && pm2 describe '$PM2_NAME' | grep -q online" \
  || { echo "    FALLO  $PM2_NAME no está online o :4000 no responde" >&2; verify_failed=1; }

if [[ -n "$verify_failed" ]]; then
  rollback
  fail "La verificación posterior falló; se restauró el respaldo $BUILD_ID."
fi

log "Deploy $BUILD_ID finalizado correctamente. Respaldo previo: $BACKUP_DIR"
