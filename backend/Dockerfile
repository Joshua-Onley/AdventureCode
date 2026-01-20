# Minimal python 3.11 base image (slim means smaller image size)
FROM python:3.11-slim

# sets /app as the working directory within the container - all subsequent commands run from here 
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# container listens on port 8000
EXPOSE 8000

# default command when container starts
# --host 0.0.0.0 listen on all network interfaces
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]