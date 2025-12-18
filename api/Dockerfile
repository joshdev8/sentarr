FROM python:3.11-slim

WORKDIR /app

# Install dependencies
RUN pip install --no-cache-dir flask flask-cors

# Copy application
COPY server.py /app/server.py

# Make script executable
RUN chmod +x /app/server.py

# Expose API port
EXPOSE 5000

# Run the API server
CMD ["python", "-u", "/app/server.py"]
