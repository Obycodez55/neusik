# Neusik - AI-Powered Audio Separation

Neusik is a web application that uses AI to remove background music from audio/video files, leaving only clear, isolated speech/vocals.

## Features

- Upload audio/video files (MP3, WAV, M4A, FLAC, OGG, AAC, MP4)
- AI-powered vocal separation using Demucs
- Real-time progress tracking
- Download isolated vocals
- Modern, responsive UI

## Tech Stack

- **Frontend**: Next.js 16, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js, TypeScript, BullMQ
- **AI Processing**: Python 3.11+, Demucs 4.0
- **Queue**: Redis, BullMQ
- **Containerization**: Docker, Docker Compose

## Quick Start with Docker

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+

### Start All Services

```bash
# Clone repository
git clone <repository-url>
cd neusik

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### Access Application

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **Redis**: localhost:6379

### Stop Services

```bash
docker-compose down
```

## Local Development (Without Docker)

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Python Worker

```bash
cd python-worker
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Redis

```bash
# macOS
brew install redis
brew services start redis

# Linux
sudo apt-get install redis-server
sudo systemctl start redis
```

## Project Structure

```
neusik/
├── backend/          # Express.js API server
├── frontend/         # Next.js frontend
├── python-worker/    # Python audio processing
├── docker-compose.yml
└── DEPLOYMENT.md     # Deployment guide
```

## Environment Variables

See `.env.example` for required environment variables.

## Documentation

- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)
- [Python Worker README](python-worker/README.md)
- [Deployment Guide](DEPLOYMENT.md)

## License

ISC

