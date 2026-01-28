#!/bin/bash
# Script para iniciar frontend y backend en Mac

DIR="$(cd "$(dirname "$0")" && pwd)"

# Detener procesos previos
test -f "$DIR/detener-dev.sh" && bash "$DIR/detener-dev.sh"

# Iniciar frontend si el puerto 5175 está libre
if ! lsof -i :5175 > /dev/null; then
  (cd "$DIR/frontend" && npm run dev &)
  sleep 2
  open http://localhost:5175
else
  echo "El puerto 5175 ya está en uso. No se iniciará el frontend."
fi

# Iniciar backend si el puerto 4000 está libre
if ! lsof -i :4000 > /dev/null; then
  (cd "$DIR/backend" && npm run dev &)
else
  echo "El puerto 4000 ya está en uso. No se iniciará el backend."
fi

echo "Script finalizado."
