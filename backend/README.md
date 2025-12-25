# Neusik Backend API

Express.js backend API with TypeScript for audio separation using Demucs AI.

## Features

- File upload with validation
- Audio processing via Python integration
- RESTful API endpoints
- Comprehensive error handling
- TypeScript for type safety
- Hot reload in development

## Prerequisites

- Node.js 20+ 
- Python 3.11+ (for audio processing)
- npm or yarn

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

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
```

### 3. Ensure Python Worker is Ready

The backend requires the Python separation script to be set up. Make sure:

1. Python worker is installed: `../python-worker/separate.py` exists
2. Python virtual environment is activated (if using venv)
3. Demucs is installed in the Python environment

## Running the Server

### Development Mode

```bash
npm run dev
```

This starts the server with hot reload using nodemon.

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

### Process Audio

**POST /api/separation/process**

Process an audio file to separate vocals from background music.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Field name: `audio`
- Body: Audio file (MP3, WAV, M4A, FLAC, OGG, AAC, MP4)

**Success Response:**
- Status: `200 OK`
- Content-Type: `audio/mpeg`
- Body: Processed audio file (vocals.mp3)

**Error Response:**
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

**Error Codes:**
- `VALIDATION_ERROR` (400): Invalid file or missing file
- `FILE_UPLOAD_ERROR` (400): File upload failed
- `PROCESSING_ERROR` (500): Audio processing failed
- `NOT_FOUND` (404): Endpoint not found

## Example Usage

### Using curl

```bash
# Health check
curl http://localhost:3000/

# Process audio file
curl -X POST \
  -F "audio=@song.mp3" \
  http://localhost:3000/api/separation/process \
  --output vocals.mp3
```

### Using JavaScript (fetch)

```javascript
const formData = new FormData();
formData.append('audio', fileInput.files[0]);

const response = await fetch('http://localhost:3000/api/separation/process', {
  method: 'POST',
  body: formData
});

if (response.ok) {
  const blob = await response.blob();
  // Handle downloaded file
} else {
  const error = await response.json();
  console.error('Error:', error);
}
```

## File Upload Limits

- **Maximum file size**: 100MB (configurable via `MAX_FILE_SIZE_MB`)
- **Allowed formats**: MP3, WAV, M4A, FLAC, OGG, AAC, MP4
- **Storage**: Temporary files in `uploads/` directory
- **Cleanup**: Files are automatically deleted after processing

## Project Structure

```
backend/
├── src/
│   ├── index.ts              # Main Express server
│   ├── routes/
│   │   └── separation.ts    # API routes
│   ├── services/
│   │   └── processor.ts     # Python integration
│   └── utils/
│       ├── errors.ts        # Error handling
│       ├── storage.ts       # File utilities
│       └── upload.ts        # Multer configuration
├── uploads/                  # Temporary input files
├── outputs/                  # Temporary output files
├── dist/                     # Compiled JavaScript
├── .env                      # Environment variables
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

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

## Troubleshooting

### Server won't start

- Check if port 3000 is already in use
- Verify Node.js version: `node --version` (should be 20+)
- Check for TypeScript errors: `npm run type-check`

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

### "Cannot find module" errors

- Run `npm install` to install dependencies
- Check TypeScript compilation: `npm run build`
- Verify file paths are correct

### Processing takes too long

- This is normal - processing time is typically 1-2x audio duration
- First run is slower due to model download
- Check server logs for Python script output

## Development

### Scripts

- `npm run dev`: Start development server with hot reload
- `npm run build`: Compile TypeScript to JavaScript
- `npm run start`: Run compiled JavaScript
- `npm run type-check`: Type check without compiling
- `npm run clean`: Remove dist directory

### Code Style

- TypeScript strict mode enabled
- ESLint recommended (can be added)
- Prettier recommended (can be added)

## Production Deployment

1. Build the project: `npm run build`
2. Set `NODE_ENV=production`
3. Configure environment variables
4. Start server: `npm start`
5. Use process manager (PM2, systemd, etc.)

## Security Considerations

- File size limits prevent DoS attacks
- File type validation prevents malicious uploads
- CORS should be configured for production
- Consider adding rate limiting
- Input sanitization in place

## Next Steps

- Add job queue for async processing (BullMQ + Redis)
- Add database for job tracking
- Add authentication/authorization
- Add rate limiting
- Add request logging
- Add monitoring and metrics

## License

ISC

