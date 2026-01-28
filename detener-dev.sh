#!/bin/bash
# Script para detener procesos en los puertos 5175 y 4000 (frontend y backend)

for port in 5175 4000; do
  pid=$(lsof -ti tcp:$port)
  if [ -n "$pid" ]; then
    echo "Matando proceso en puerto $port (PID: $pid)"
    kill -9 $pid
  else
    echo "No hay proceso en puerto $port"
  fi
done

echo "Procesos finalizados."
