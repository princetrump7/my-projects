# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONUTF8=1

# Set the working directory in the container
WORKDIR /app

# Install system dependencies (needed for some python packages)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy project files (now inside marketpulse/ subdirectory)
COPY marketpulse/requirements.txt marketpulse/pyproject.toml ./

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY marketpulse/ ./
COPY entrypoint.sh .

# Make entrypoint executable
RUN chmod +x entrypoint.sh

# Expose port for Hugging Face Spaces / cloud hosting
EXPOSE 7860

# Run both the bot and the web server
CMD ["./entrypoint.sh"]
