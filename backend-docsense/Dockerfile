FROM python:3.12-slim

WORKDIR /app

# Dependências de sistema necessárias para compilar pacotes nativos
# (ex: extensões C de algumas libs). PyMuPDF e fastembed já trazem
# wheels manylinux prontos, então isso é uma rede de segurança.
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir uv

# Correção importante: o Dockerfile original copiava SÓ o pyproject.toml
# e instalava o pacote em modo editável (-e .) ANTES de copiar o código —
# como o backend usa hatchling e o diretório app/ ainda não existia nesse
# ponto, o build do pacote falhava (ou instalava um pacote vazio). Agora
# copiamos todo o código primeiro e instalamos em modo normal (não editável).
COPY . .

RUN uv pip install --system --no-cache .

EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
