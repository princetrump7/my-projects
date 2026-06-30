FROM python:3.12-slim

WORKDIR /app

# Install system dependencies for potential build needs
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Run in webhook mode (WEBHOOK_URL must be set at runtime)
CMD ["python", "main.py"]
