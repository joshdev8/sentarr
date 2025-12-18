FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install dependencies
RUN pip install --no-cache-dir requests

# Copy application
COPY app/monitor.py /app/monitor.py

# Make script executable
RUN chmod +x /app/monitor.py

# Run the monitor
CMD ["python", "-u", "/app/monitor.py"]
