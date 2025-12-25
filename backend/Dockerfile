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

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Install Python dependencies for audio processing
# Note: python-worker is mounted as volume in docker-compose.yml
# Dependencies are installed at runtime via: docker-compose exec backend pip3 install --break-system-packages -r /app/python-worker/requirements.txt
# For production, consider copying requirements.txt into the image during build

# Create directories for uploads and outputs
RUN mkdir -p uploads outputs

# Expose port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Start server
CMD ["node", "dist/index.js"]

