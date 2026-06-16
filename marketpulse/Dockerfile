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
    && rm -rf /var/lib/apt/lists/*

# Copy project files
COPY pyproject.toml requirements.txt ./

# Install dependencies
RUN pip install --no-cache-dir -e .

# Copy the rest of the application code
COPY . .

# Make entrypoint executable
RUN chmod +x entrypoint.sh

# Expose port for Hugging Face Spaces / cloud hosting
EXPOSE 7860

# Run both the bot and the web server
CMD ["./entrypoint.sh"]
