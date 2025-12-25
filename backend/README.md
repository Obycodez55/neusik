# Neusik Backend API

Express.js backend API with TypeScript for audio separation using Demucs AI, with asynchronous job queue processing.

## Features

- File upload with validation
- Asynchronous audio processing via job queue (BullMQ + Redis)
- Progress tracking for long-running jobs
- RESTful API endpoints
- Comprehensive error handling
- TypeScript for type safety
- Hot reload in development
- Queue monitoring and statistics

## Prerequisites

- Node.js 20+ 
- Python 3.11+ (for audio processing)
- Redis 6+ (for job queue)
- npm or yarn

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Install and Start Redis

**macOS (Homebrew):**
```bash
brew install redis
brew services start redis
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

**Docker:**
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

**Cloud Options:**
- Redis Cloud (free tier available)
- Upstash (serverless Redis)
- AWS ElastiCache

### 3. Environment Configuration

Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# File Upload Configuration
MAX_FILE_SIZE_MB=100
UPLOAD_DIR=uploads
OUTPUT_DIR=outputs

# Python Configuration
PYTHON_PATH=python3

# CORS Configuration
CORS_ORIGIN=*

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
# OR use REDIS_URL instead:
# REDIS_URL=redis://localhost:6379

# Job Queue Configuration
JOB_CONCURRENCY=1
JOB_RETRY_ATTEMPTS=3
JOB_RETRY_DELAY_MS=5000
JOB_TIMEOUT_MS=900000
JOB_RETENTION_HOURS=24
```

### 4. Ensure Python Worker is Ready

The backend requires the Python separation script to be set up. Make sure:

1. Python worker is installed: `../python-worker/separate.py` exists
2. Python virtual environment is activated (if using venv)
3. Demucs is installed in the Python environment

## Running the Server

### Development Mode

```bash
npm run dev
```

This starts the server with hot reload using nodemon and initializes the job queue worker.

### Production Mode

```bash
npm run build
npm start
```

### Type Checking

```bash
npm run type-check
```

## API Endpoints

### Health Check

**GET /** 

Returns server status.

**Response:**
```json
{
  "status": "ok",
  "message": "Neusik API is running",
  "version": "1.0.0"
}
```

### Queue Health Check

**GET /health/queue**

Returns queue and Redis connection status.

**Response:**
```json
{
  "status": "healthy",
  "redis": "connected",
  "queue": {
    "waiting": 0,
    "active": 1,
    "completed": 42,
    "failed": 2,
    "delayed": 0,
    "total": 45
  }
}
```

### Queue Statistics

**GET /api/queue/stats**

Returns detailed queue statistics.

**Response:**
```json
{
  "waiting": 0,
  "active": 1,
  "completed": 42,
  "failed": 2,
  "delayed": 0,
  "total": 45
}
```

### Process Audio (Queue Job)

**POST /api/separation/process**

Queue an audio separation job. Returns immediately with job ID.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Field name: `audio`
- Body: Audio file (MP3, WAV, M4A, FLAC, OGG, AAC, MP4)

**Success Response (202 Accepted):**
```json
{
  "jobId": "output_1234567890_abc123",
  "status": "queued",
  "statusUrl": "/api/separation/status/output_1234567890_abc123",
  "downloadUrl": "/api/separation/download/output_1234567890_abc123"
}
```

**Error Response:**
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Get Job Status

**GET /api/separation/status/:jobId**

Get the status and progress of a queued job.

**Response:**
```json
{
  "jobId": "output_1234567890_abc123",
  "status": "active",
  "progress": 45,
  "result": null,
  "error": null
}
```

**Status Values:**
- `queued`: Job is waiting to be processed
- `active`: Job is currently being processed
- `completed`: Job completed successfully
- `failed`: Job failed (check error field)
- `delayed`: Job is delayed (retry)

**Progress:** Number from 0-100 indicating processing progress

### Download Processed Audio

**GET /api/separation/download/:jobId**

Download the processed audio file for a completed job.

**Success Response:**
- Status: `200 OK`
- Content-Type: `audio/mpeg`
- Body: Processed audio file (vocals.mp3)

**Error Response:**
```json
{
  "error": "Job is not completed. Current status: active",
  "code": "VALIDATION_ERROR"
}
```

## Usage Flow

### 1. Upload and Queue Job

```bash
curl -X POST \
  -F "audio=@song.mp3" \
  http://localhost:3000/api/separation/process
```

Response:
```json
{
  "jobId": "output_1234567890_abc123",
  "status": "queued",
  "statusUrl": "/api/separation/status/output_1234567890_abc123",
  "downloadUrl": "/api/separation/download/output_1234567890_abc123"
}
```

### 2. Poll Job Status

```bash
curl http://localhost:3000/api/separation/status/output_1234567890_abc123
```

Poll every 2-5 seconds until status is `completed` or `failed`.

### 3. Download Result

```bash
curl http://localhost:3000/api/separation/download/output_1234567890_abc123 \
  --output vocals.mp3
```

### JavaScript Example

```javascript
// 1. Upload file
const formData = new FormData();
formData.append('audio', fileInput.files[0]);

const uploadResponse = await fetch('http://localhost:3000/api/separation/process', {
  method: 'POST',
  body: formData
});

const { jobId, statusUrl } = await uploadResponse.json();

// 2. Poll for status
const pollStatus = async () => {
  const response = await fetch(`http://localhost:3000${statusUrl}`);
  const status = await response.json();
  
  if (status.status === 'completed') {
    // 3. Download result
    const downloadResponse = await fetch(`http://localhost:3000/api/separation/download/${jobId}`);
    const blob = await downloadResponse.blob();
    // Handle downloaded file
  } else if (status.status === 'failed') {
    console.error('Processing failed:', status.error);
  } else {
    // Still processing, poll again
    setTimeout(pollStatus, 2000);
  }
};

pollStatus();
```

## File Upload Limits

- **Maximum file size**: 100MB (configurable via `MAX_FILE_SIZE_MB`)
- **Allowed formats**: MP3, WAV, M4A, FLAC, OGG, AAC, MP4
- **Storage**: Temporary files in `uploads/` directory
- **Cleanup**: Files are automatically deleted after processing

## Job Queue Configuration

- **Concurrency**: Number of jobs processed simultaneously (default: 1)
- **Retry attempts**: Number of retries on failure (default: 3)
- **Job timeout**: Maximum time for a job (default: 15 minutes)
- **Job retention**: How long to keep completed jobs (default: 24 hours)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |
| `MAX_FILE_SIZE_MB` | Maximum upload size (MB) | `100` |
| `UPLOAD_DIR` | Upload directory | `uploads` |
| `OUTPUT_DIR` | Output directory | `outputs` |
| `PYTHON_PATH` | Python executable path | `python3` |
| `CORS_ORIGIN` | CORS allowed origin | `*` |
| `REDIS_HOST` | Redis server host | `localhost` |
| `REDIS_PORT` | Redis server port | `6379` |
| `REDIS_PASSWORD` | Redis password | (empty) |
| `REDIS_URL` | Redis connection URL | (empty) |
| `JOB_CONCURRENCY` | Concurrent jobs | `1` |
| `JOB_RETRY_ATTEMPTS` | Retry attempts | `3` |
| `JOB_RETRY_DELAY_MS` | Retry delay (ms) | `5000` |
| `JOB_TIMEOUT_MS` | Job timeout (ms) | `900000` |
| `JOB_RETENTION_HOURS` | Job retention (hours) | `24` |

## Project Structure

```
backend/
├── src/
│   ├── index.ts              # Main Express server
│   ├── routes/
│   │   └── separation.ts    # API routes
│   ├── services/
│   │   ├── processor.ts     # Python integration
│   │   └── queue.ts         # Job queue service
│   ├── types/
│   │   └── jobs.ts          # Job type definitions
│   └── utils/
│       ├── errors.ts        # Error handling
│       ├── storage.ts       # File utilities
│       ├── upload.ts        # Multer configuration
│       └── redis.ts         # Redis connection
├── uploads/                  # Temporary input files
├── outputs/                  # Temporary output files
├── dist/                     # Compiled JavaScript
├── .env                      # Environment variables
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Troubleshooting

### Server won't start

- Check if port 3000 is already in use
- Verify Node.js version: `node --version` (should be 20+)
- Check for TypeScript errors: `npm run type-check`

### Redis connection errors

- Verify Redis is running: `redis-cli ping` (should return PONG)
- Check Redis host and port in `.env`
- Verify Redis password if required
- Test connection: `redis-cli -h localhost -p 6379`

### Jobs not processing

- Check queue worker is initialized (should see logs on startup)
- Verify Redis connection is working
- Check job status endpoint for error details
- Review server logs for Python script errors

### File upload fails

- Verify file size is within limits
- Check file format is supported
- Ensure `uploads/` directory exists and is writable
- Check file permissions

### Python processing fails

- Verify Python script exists: `../python-worker/separate.py`
- Check Python executable path: `which python3`
- Ensure Python virtual environment is activated (if using venv)
- Verify Demucs is installed: `python3 -c "import demucs"`

### Job status stuck

- Check if job is actually processing (check logs)
- Verify Python script is running
- Check for timeout errors
- Review failed job error messages

## Development

### Scripts

- `npm run dev`: Start development server with hot reload
- `npm run build`: Compile TypeScript to JavaScript
- `npm run start`: Run compiled JavaScript
- `npm run type-check`: Type check without compiling
- `npm run clean`: Remove dist directory

### Monitoring Queue

Check queue statistics:
```bash
curl http://localhost:3000/api/queue/stats
```

Check queue health:
```bash
curl http://localhost:3000/health/queue
```

## Production Deployment

1. Build the project: `npm run build`
2. Set `NODE_ENV=production`
3. Configure environment variables
4. Ensure Redis is running and accessible
5. Start server: `npm start`
6. Use process manager (PM2, systemd, etc.)

**Important:** The queue worker runs in the same process as the API server. For production, consider:
- Running workers in separate processes for better scalability
- Using a process manager to restart workers on failure
- Monitoring Redis memory usage
- Setting up job cleanup cron jobs

## Security Considerations

- File size limits prevent DoS attacks
- File type validation prevents malicious uploads
- CORS should be configured for production
- Consider adding rate limiting
- Input sanitization in place
- Redis should be secured (password, firewall)

## Next Steps

- Add database for job history persistence
- Add user authentication/authorization
- Add rate limiting per user
- Add job cancellation endpoint
- Add batch processing support
- Add WebSocket for real-time progress updates

## License

ISC
