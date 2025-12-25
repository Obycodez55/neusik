# Neusik Deployment Guide

Complete guide for deploying Neusik using Docker and Docker Compose.

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Git (for cloning repository)

## Local Development with Docker

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd neusik
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start all services and install Python dependencies** (first time)
   ```bash
   # Build and start services
   docker-compose up -d --build
   
   # Install Python dependencies in backend container
   docker-compose exec backend pip3 install -r /app/python-worker/requirements.txt
   ```

4. **Start all services** (subsequent times)
   ```bash
   docker-compose up -d
   ```

5. **View logs**
   ```bash
   docker-compose logs -f
   ```

6. **Access the application**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000
   - Redis: localhost:6379

### Services

- **redis**: Redis server for job queue
- **backend**: Express.js API server
- **frontend**: Next.js frontend application

### Useful Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f [service-name]

# Rebuild services
docker-compose build

# Restart a service
docker-compose restart [service-name]

# Execute command in container
docker-compose exec backend sh
docker-compose exec frontend sh

# View running containers
docker-compose ps

# Remove volumes (clean slate)
docker-compose down -v
```

## Building Docker Images

### Backend

```bash
cd backend
docker build -t neusik-backend .
```

### Frontend

```bash
cd frontend
docker build -t neusik-frontend .
```

### Python Worker

```bash
cd python-worker
docker build -t neusik-python-worker .
```

## Production Deployment

### Environment Variables

Set the following environment variables in your deployment platform:

#### Backend
- `NODE_ENV=production`
- `PORT=3000` (or your port)
- `REDIS_HOST=<redis-host>`
- `REDIS_PORT=6379`
- `REDIS_URL=redis://<redis-host>:6379`
- `UPLOAD_DIR=uploads`
- `OUTPUT_DIR=outputs`
- `PYTHON_PATH=python3`
- `MAX_FILE_SIZE_MB=100`
- `CORS_ORIGIN=<your-frontend-url>`

#### Frontend
- `NODE_ENV=production`
- `NEXT_PUBLIC_API_URL=<your-backend-url>`

### Deployment to Render.com

1. **Create Redis Service**
   - Go to Render Dashboard
   - Create new Redis service
   - Note the Redis URL

2. **Deploy Backend**
   - Create new Web Service
   - Connect GitHub repository
   - Root Directory: `backend`
   - Build Command: `docker build -t neusik-backend .`
   - Start Command: `docker run -p 10000:3000 neusik-backend`
   - Environment Variables: Set all backend variables
   - Add Redis URL from step 1

3. **Deploy Frontend**
   - Create new Web Service
   - Connect GitHub repository
   - Root Directory: `frontend`
   - Build Command: `docker build -t neusik-frontend .`
   - Start Command: `docker run -p 10000:3000 neusik-frontend`
   - Environment Variables: Set `NEXT_PUBLIC_API_URL` to backend URL

### Deployment to Railway

1. **Create Project**
   - Connect GitHub repository
   - Railway auto-detects Docker

2. **Add Redis**
   - Add Redis service from Railway marketplace
   - Note the Redis URL

3. **Configure Services**
   - Backend: Set root directory to `backend`
   - Frontend: Set root directory to `frontend`
   - Set environment variables for each service

4. **Deploy**
   - Railway automatically builds and deploys
   - Get URLs from Railway dashboard

## Health Checks

### Backend Health Check
```bash
curl http://localhost:3000/
```

Expected response:
```json
{
  "status": "ok",
  "message": "Neusik API is running"
}
```

### Queue Health Check
```bash
curl http://localhost:3000/health/queue
```

### Frontend Health Check
```bash
curl http://localhost:3001/
```

## Troubleshooting

### Services won't start

1. **Check Docker is running**
   ```bash
   docker ps
   ```

2. **Check logs**
   ```bash
   docker-compose logs
   ```

3. **Check port conflicts**
   ```bash
   lsof -i :3000
   lsof -i :3001
   lsof -i :6379
   ```

### Backend can't connect to Redis

1. **Check Redis is running**
   ```bash
   docker-compose ps redis
   ```

2. **Check Redis connection**
   ```bash
   docker-compose exec redis redis-cli ping
   ```

3. **Verify environment variables**
   ```bash
   docker-compose exec backend env | grep REDIS
   ```

### Frontend can't connect to backend

1. **Check backend is running**
   ```bash
   curl http://localhost:3000/
   ```

2. **Verify NEXT_PUBLIC_API_URL**
   ```bash
   docker-compose exec frontend env | grep NEXT_PUBLIC
   ```

3. **Check CORS configuration**
   - Ensure `CORS_ORIGIN` includes frontend URL

### File upload fails

1. **Check upload directory permissions**
   ```bash
   docker-compose exec backend ls -la uploads
   ```

2. **Check disk space**
   ```bash
   docker system df
   ```

3. **Check file size limits**
   - Verify `MAX_FILE_SIZE_MB` is set correctly

### Python processing fails

1. **Check Python worker is accessible**
   ```bash
   docker-compose exec backend ls -la /app/python-worker
   ```

2. **Test Python script**
   ```bash
   docker-compose exec backend python3 /app/python-worker/separate.py --help
   ```

3. **Check FFmpeg is installed**
   ```bash
   docker-compose exec backend ffmpeg -version
   ```

## Scaling Considerations

### Horizontal Scaling

- **Backend**: Can scale multiple instances
- **Frontend**: Can scale multiple instances
- **Redis**: Single instance (or Redis Cluster for high availability)
- **Python Worker**: Can run in separate containers or same as backend

### Resource Requirements

- **Backend**: 512MB RAM minimum, 1GB recommended
- **Frontend**: 256MB RAM minimum
- **Redis**: 256MB RAM minimum
- **Python Worker**: 2GB RAM minimum (for Demucs model)

### Database Considerations

- Currently uses Redis for job queue
- Consider PostgreSQL for job history (future enhancement)
- Redis persistence can be enabled

## Security Best Practices

1. **Use environment variables** for sensitive data
2. **Don't commit** `.env` files
3. **Use non-root user** in containers (future enhancement)
4. **Configure CORS** properly for production
5. **Use HTTPS** in production
6. **Set file size limits** to prevent DoS
7. **Validate file types** on upload
8. **Regularly update** base images

## Monitoring

### Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f redis
```

### Metrics

- Backend health: `/health/queue`
- Queue stats: `/api/queue/stats`
- Job status: `/api/separation/status/:jobId`

## Backup and Recovery

### Redis Data

```bash
# Backup
docker-compose exec redis redis-cli SAVE
docker cp <container-id>:/data/dump.rdb ./backup.rdb

# Restore
docker cp ./backup.rdb <container-id>:/data/dump.rdb
docker-compose restart redis
```

### Uploaded Files

- Files are temporary and cleaned up after processing
- Consider implementing cloud storage (S3/R2) for production

## Support

For issues and questions:
- Check logs: `docker-compose logs`
- Review environment variables
- Check service health endpoints
- Verify network connectivity between services

