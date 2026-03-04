#!/bin/bash
# DocSense — Script de inicialização rápida
# Execute: chmod +x start.sh && ./start.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║      DocSense — Setup & Start        ║"
echo "╚══════════════════════════════════════╝"
echo ""

# 1. Verificar .env
if [ ! -f "$ENV_FILE" ]; then
  echo "⚠️  .env não encontrado. Criando a partir de .env.example..."
  cp "$SCRIPT_DIR/.env.example" "$ENV_FILE"
  echo ""
  echo "❗ IMPORTANTE: Edite o arquivo .env e adicione sua chave Groq em OPENAI_API_KEY"
  echo "   Obtenha em: https://console.groq.com/keys (criar sem expiração)"
  echo ""
  read -p "Pressione Enter após editar o .env para continuar..."
fi

# 2. Verificar chave
source "$ENV_FILE"
if [ -z "$OPENAI_API_KEY" ] || [ "$OPENAI_API_KEY" = "YOUR_GROQ_API_KEY_HERE" ]; then
  echo "❌ OPENAI_API_KEY não configurada no .env"
  echo "   Edite .env e adicione sua chave Groq"
  exit 1
fi

echo "✅ Chave configurada: ${OPENAI_API_KEY:0:10}..."

# 3. Docker
echo ""
echo "🐳 Iniciando serviços Docker..."
cd "$SCRIPT_DIR"
docker compose up -d
echo "⏳ Aguardando serviços ficarem saudáveis..."
sleep 5
docker compose ps

# 4. Backend
echo ""
echo "🐍 Configurando backend..."
cd "$SCRIPT_DIR/backend"

if ! command -v uv &> /dev/null; then
  echo "❌ uv não encontrado. Instale com: pip install uv"
  exit 1
fi

uv sync --quiet
export $(grep -v '^#' "$ENV_FILE" | xargs)
uv run alembic upgrade head

echo "✅ Migrações aplicadas"

# 5. Iniciar backend em background
echo ""
echo "🚀 Iniciando backend em http://localhost:8000 ..."
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
sleep 3

# Verificar backend
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
  echo "✅ Backend rodando — http://localhost:8000"
  echo "   Docs: http://localhost:8000/docs"
else
  echo "❌ Backend não respondeu. Verifique os logs."
  kill $BACKEND_PID 2>/dev/null
  exit 1
fi

# 6. Frontend
echo ""
echo "⚡ Configurando frontend..."
cd "$SCRIPT_DIR/frontend"

if ! command -v node &> /dev/null; then
  echo "❌ Node.js não encontrado. Instale Node.js 18+"
  kill $BACKEND_PID
  exit 1
fi

npm install --silent
echo "✅ Dependências instaladas"

echo ""
echo "🌐 Iniciando frontend em http://localhost:3000 ..."
npm run dev &
FRONTEND_PID=$!
sleep 4

echo ""
echo "╔══════════════════════════════════════╗"
echo "║        DocSense está rodando!        ║"
echo "╠══════════════════════════════════════╣"
echo "║  Frontend:  http://localhost:3000    ║"
echo "║  Backend:   http://localhost:8000    ║"
echo "║  API Docs:  http://localhost:8000/docs║"
echo "╚══════════════════════════════════════╝"
echo ""
echo "Pressione Ctrl+C para parar tudo"

# Aguardar e cleanup
trap "echo ''; echo 'Parando...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; docker compose stop; echo 'Tudo parado.'" EXIT
wait
