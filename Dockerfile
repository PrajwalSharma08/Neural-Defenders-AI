# ==============================================================================
# SentinelShield AI — Production Dockerfile for Cloud Deployment
# Compatible with Render, Railway, Fly.io, Hugging Face Spaces, GCP Cloud Run
# ==============================================================================
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system audio & build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libsndfile1 \
    ffmpeg \
    libmagic1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt
RUN pip install --no-cache-dir python-docx

# Copy backend and frontend source code
COPY backend /app/backend
COPY frontend /app/frontend

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV APP_HOST=0.0.0.0
ENV PORT=8888

# Expose port
EXPOSE 8888

# Start FastAPI server
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8888}"]
