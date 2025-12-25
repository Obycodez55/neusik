FROM node:20-slim

# Install Python 3, FFmpeg and system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm ci

# Copy Python requirements first (for better caching)
# Note: python-requirements.txt should be kept in sync with ../python-worker/requirements.txt
COPY python-requirements.txt /tmp/python-requirements.txt

# Install Python dependencies for audio processing
RUN pip3 install --break-system-packages --no-cache-dir -r /tmp/python-requirements.txt && \
    rm /tmp/python-requirements.txt

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Create directories for uploads and outputs
RUN mkdir -p uploads outputs

# Expose port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Start server
CMD ["node", "dist/index.js"]

