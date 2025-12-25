# VoiceIsolate - Comprehensive Project Plan

## 🎯 Project Overview

### What We're Building
**VoiceIsolate** (or alternative name) is a web application that uses AI to remove background music from audio/video files, leaving only clear, isolated speech/vocals.

### Use Cases
- Extracting dialogue from movies
- Cleaning up podcast recordings with background music
- Isolating vocals from songs
- Recovering clear speech from noisy audio

### Core Value Proposition
- Upload any audio/video file
- AI automatically separates vocals from music
- Download clean, isolated voice track
- Simple, fast, no audio engineering knowledge needed

---

## 🏗️ Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  - File upload (audio/video)                                │
│  - Progress tracking                                        │
│  - Audio preview/playback                                   │
│  - Download results                                         │
└────────────────────┬────────────────────────────────────────┘
                     │ REST API
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              TypeScript Backend (Node.js/Express)            │
│  - Authentication (optional v2)                             │
│  - File upload handling                                     │
│  - Job queue management (Bull)                              │
│  - Database (job status, user data)                         │
│  - File storage orchestration                               │
└────────────────────┬────────────────────────────────────────┘
                     │ Child Process / Queue
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                  Python Processing Layer                     │
│  - Demucs AI model                                          │
│  - Audio separation                                         │
│  - Format conversion (FFmpeg)                               │
└─────────────────────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                 Storage (Cloudflare R2 / S3)                │
│  - Input files (temp)                                       │
│  - Output files (24hr expiry)                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Technology Stack

### Backend (Node.js/TypeScript)
- **Runtime**: Node.js 20+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (job tracking, metadata)
- **Queue System**: BullMQ + Redis (background job processing)
- **File Upload**: Multer
- **Storage**: Cloudflare R2 (S3-compatible)
- **Validation**: Zod

### AI/Processing Layer
- **Language**: Python 3.11+
- **AI Model**: Demucs 4.0 (Meta/Facebook)
- **Audio Processing**: FFmpeg
- **Communication**: Child process spawning (simple) or Redis queue (production)

### Frontend
- **Framework**: React + TypeScript (or Next.js)
- **Styling**: Tailwind CSS
- **File Upload**: react-dropzone
- **State Management**: React Query (for API calls)
- **Audio Player**: wavesurfer.js or HTML5 audio

### DevOps & Infrastructure
- **Containerization**: Docker
- **Deployment**: Render.com / Railway (free tier)
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry (for errors, later phase)

---

## 🎨 Features Breakdown

### MVP (Version 1.0) - 2 weeks
- ✅ Upload audio file (MP3, WAV, M4A)
- ✅ Process file (separate vocals from music)
- ✅ Display progress ("Processing... 45%")
- ✅ Download isolated vocals
- ✅ Simple, clean UI

### Version 1.5 - +1 week
- ✅ Video file support (extract audio, process, return)
- ✅ Preview both original and processed audio
- ✅ Better error handling & user feedback
- ✅ Rate limiting (prevent abuse)

### Version 2.0 - +2 weeks
- ✅ User accounts (save processing history)
- ✅ Batch processing (multiple files)
- ✅ Additional separation options:
  - Vocals only (current)
  - Music only (inverse)
  - Advanced: vocals, drums, bass, other (4-stem)
- ✅ API for developers

### Future Ideas
- Real-time processing (WebSocket progress)
- Direct YouTube URL processing
- Cloud storage integrations (Google Drive, Dropbox)
- Subscription model for heavy users

---

## 🛠️ Detailed Build Plan

## Phase 1: MVP Foundation (Week 1)

### Phase 1.1: Python Processing Layer (Days 1-2)

**Goal**: Create working audio separation script

**Setup**:
```bash
mkdir voiceisolate && cd voiceisolate
mkdir backend frontend python-worker

# Python worker setup
cd python-worker
python3 -m venv venv
source venv/bin/activate
pip install demucs
```

**Create `separate.py`**:
```python
import sys
import json
import os
from pathlib import Path
from demucs.separate import main as separate_main

def process_audio(input_path: str, output_dir: str):
    try:
        # Run Demucs separation
        separate_main([
            input_path,
            '-o', output_dir,
            '--two-stems', 'vocals',  # vocals only
            '--mp3',  # output as MP3
            '--mp3-bitrate', '256'
        ])
        
        # Find output file
        vocals_path = Path(output_dir) / 'htdemucs' / Path(input_path).stem / 'vocals.mp3'
        
        if vocals_path.exists():
            return {
                'status': 'success',
                'output_path': str(vocals_path),
                'size': vocals_path.stat().st_size
            }
        else:
            return {'status': 'error', 'message': 'Output not found'}
            
    except Exception as e:
        return {'status': 'error', 'message': str(e)}

if __name__ == '__main__':
    input_file = sys.argv[1]
    output_dir = sys.argv[2]
    
    result = process_audio(input_file, output_dir)
    print(json.dumps(result))
```

**Test**:
```bash
python separate.py test-song.mp3 ./output
# Should produce: output/htdemucs/test-song/vocals.mp3
```

**Deliverables**:
- ✅ Python virtual environment
- ✅ Demucs integration script
- ✅ Audio separation working locally
- ✅ Output: isolated vocals as MP3

**Success Criteria**: Can run `python separate.py input.mp3 output/` and get `vocals.mp3`

---

### Phase 1.2: Backend API - Core (Days 3-4)

**Goal**: Create Express.js API with file upload and Python integration

**Setup**:
```bash
cd ../backend
npm init -y
npm install express multer dotenv cors
npm install -D typescript @types/node @types/express @types/multer ts-node nodemon
npx tsc --init
```

**Project Structure**:
```
backend/
├── src/
│   ├── index.ts           # Main server
│   ├── routes/
│   │   └── separation.ts  # API routes
│   ├── services/
│   │   └── processor.ts   # Python integration
│   └── utils/
│       └── storage.ts     # File handling
├── uploads/               # Temp input files
├── outputs/               # Temp output files
└── package.json
```

**Key Files**:

**`src/index.ts`**:
```typescript
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import separationRoutes from './routes/separation';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// File upload config
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    const allowed = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'video/mp4'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

app.use('/api/separation', separationRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**`src/services/processor.ts`**:
```typescript
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

export interface ProcessingResult {
  status: 'success' | 'error';
  outputPath?: string;
  message?: string;
}

export async function separateAudio(
  inputPath: string,
  outputDir: string
): Promise<ProcessingResult> {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, '../../../python-worker/separate.py');
    
    const python = spawn('python3', [pythonScript, inputPath, outputDir]);
    
    let output = '';
    let errorOutput = '';
    
    python.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    python.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.error('Python stderr:', data.toString());
    });
    
    python.on('close', async (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(output);
          // Clean up input file
          await fs.unlink(inputPath);
          resolve(result);
        } catch (e) {
          reject(new Error('Failed to parse Python output'));
        }
      } else {
        reject(new Error(`Processing failed: ${errorOutput}`));
      }
    });
  });
}
```

**`src/routes/separation.ts`**:
```typescript
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { separateAudio } from '../services/processor';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.post('/process', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const inputPath = req.file.path;
    const outputDir = path.join('outputs', Date.now().toString());

    const result = await separateAudio(inputPath, outputDir);

    if (result.status === 'success') {
      res.download(result.outputPath!, 'vocals.mp3', (err) => {
        if (err) console.error('Download error:', err);
        // Clean up files after download
      });
    } else {
      res.status(500).json({ error: result.message });
    }
  } catch (error) {
    console.error('Processing error:', error);
    res.status(500).json({ error: 'Processing failed' });
  }
});

export default router;
```

**Test**:
```bash
npm run dev

# In another terminal:
curl -X POST -F "audio=@test-song.mp3" http://localhost:3000/api/separation/process --output vocals.mp3
```

**Deliverables**:
- ✅ Express.js server with TypeScript
- ✅ File upload endpoint (Multer)
- ✅ Python process integration
- ✅ Basic error handling

**Success Criteria**: Can POST audio file and receive processed vocals

---

## Phase 2: Production Features (Week 2)

### Phase 2.1: Job Queue System (Days 5-6)

**Goal**: Implement background job processing to handle long-running tasks

**Why**: Processing takes 2-5 minutes, HTTP timeouts on free tier, better UX with progress updates

**Setup**:
```bash
npm install bull @types/bull ioredis
```

**Create `src/services/queue.ts`**:
```typescript
import Bull from 'bull';
import { separateAudio } from './processor';
import path from 'path';

export const separationQueue = new Bull('audio-separation', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379')
  }
});

separationQueue.process(async (job) => {
  const { inputPath, outputDir, jobId } = job.data;
  
  job.progress(10); // Starting
  
  const result = await separateAudio(inputPath, outputDir);
  
  job.progress(100); // Complete
  
  return result;
});

// Monitor
separationQueue.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

separationQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err);
});
```

**Update `src/routes/separation.ts`**:
```typescript
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { separationQueue } from '../services/queue';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.post('/process', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const jobId = `job_${Date.now()}`;
  const outputDir = path.join('outputs', jobId);

  // Add to queue
  const job = await separationQueue.add({
    inputPath: req.file.path,
    outputDir,
    jobId
  });

  res.json({
    jobId: job.id,
    status: 'queued',
    statusUrl: `/api/separation/status/${job.id}`
  });
});

router.get('/status/:jobId', async (req, res) => {
  const job = await separationQueue.getJob(req.params.jobId);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  const state = await job.getState();
  const progress = job.progress();
  
  res.json({
    jobId: job.id,
    status: state,
    progress,
    result: state === 'completed' ? job.returnvalue : null
  });
});

router.get('/download/:jobId', async (req, res) => {
  const job = await separationQueue.getJob(req.params.jobId);
  
  if (!job || await job.getState() !== 'completed') {
    return res.status(404).json({ error: 'Result not ready' });
  }

  const result = job.returnvalue;
  res.download(result.outputPath, 'vocals.mp3');
});

export default router;
```

**Deliverables**:
- ✅ BullMQ + Redis setup
- ✅ Background job processing
- ✅ Job status tracking
- ✅ Progress updates

**Success Criteria**: Upload returns job ID, can poll status, download when complete

---

### Phase 2.2: Frontend MVP (Days 7-8)

**Goal**: Create React frontend with upload, progress, and download

**Setup**:
```bash
cd ../frontend
npx create-react-app . --template typescript
npm install axios react-dropzone
```

**Create `src/App.tsx`**:
```typescript
import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('audio', file);

    try {
      const response = await axios.post('http://localhost:3000/api/separation/process', formData);
      const { jobId: newJobId } = response.data;
      setJobId(newJobId);
      pollStatus(newJobId);
    } catch (error) {
      console.error('Upload failed:', error);
      setStatus('Upload failed');
    }
  };

  const pollStatus = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/separation/status/${jobId}`);
        const { status: jobStatus, progress: jobProgress } = response.data;
        
        setStatus(jobStatus);
        setProgress(jobProgress || 0);

        if (jobStatus === 'completed') {
          clearInterval(interval);
          setDownloadUrl(`http://localhost:3000/api/separation/download/${jobId}`);
        } else if (jobStatus === 'failed') {
          clearInterval(interval);
          setStatus('Processing failed');
        }
      } catch (error) {
        console.error('Status check failed:', error);
      }
    }, 2000); // Poll every 2 seconds
  };

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>VoiceIsolate</h1>
      <p>Remove music, keep vocals</p>

      <div style={{ marginTop: '30px' }}>
        <input
          type="file"
          accept="audio/*,video/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <button onClick={handleUpload} disabled={!file || !!jobId}>
          Upload & Process
        </button>
      </div>

      {jobId && (
        <div style={{ marginTop: '30px' }}>
          <p>Status: {status}</p>
          <p>Progress: {progress}%</p>
          {downloadUrl && (
            <a href={downloadUrl} download="vocals.mp3">
              <button>Download Isolated Vocals</button>
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
```

**Deliverables**:
- ✅ React + TypeScript app
- ✅ File upload UI
- ✅ Progress tracking display
- ✅ Download functionality

**Success Criteria**: User can upload, see progress, and download result

---

### Phase 2.3: Docker & Deployment (Days 9-10)

**Goal**: Containerize application and deploy to production

**Create `Dockerfile` (root)**:
```dockerfile
FROM node:20-slim

# Install Python, FFmpeg, and system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    ffmpeg \
    redis-server \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY python-worker/requirements.txt ./python-worker/
RUN pip3 install --no-cache-dir -r python-worker/requirements.txt

# Install Node dependencies
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci --only=production

# Copy application code
COPY backend ./
COPY python-worker ../python-worker

# Build TypeScript
RUN npm run build

# Start Redis in background and run app
CMD redis-server --daemonize yes && node dist/index.js
```

**Create `docker-compose.yml` (for local dev)**:
```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      - redis
    volumes:
      - ./uploads:/app/uploads
      - ./outputs:/app/outputs
```

**Deploy to Render**:
1. Push to GitHub
2. Create new Web Service on Render
3. Connect repo
4. Build command: `docker build -t voiceisolate .`
5. Start command: Handled by Dockerfile
6. Environment variables:
   - `NODE_ENV=production`
   - `REDIS_HOST=localhost`

**Deliverables**:
- ✅ Dockerized application
- ✅ Deployed to Render/Railway
- ✅ Environment configuration

**Success Criteria**: App live and accessible, can process files

---

## Phase 3: Enhanced Features (Version 1.5) - Week 3

### Phase 3.1: Video File Support (Days 11-12)

**Goal**: Support video file uploads by extracting audio first

**Tasks**:
- Update file filter to accept video formats
- Add FFmpeg audio extraction step before processing
- Process extracted audio
- Return processed audio file

**Implementation**:
- Add FFmpeg extraction in Python script or Node.js layer
- Update API to handle video MIME types
- Extract audio to temp file, then process

**Deliverables**:
- ✅ Video upload support
- ✅ Audio extraction (FFmpeg)
- ✅ Process extracted audio
- ✅ Return audio file

---

### Phase 3.2: Audio Preview (Day 13)

**Goal**: Allow users to preview original and processed audio

**Tasks**:
- Integrate wavesurfer.js or HTML5 audio
- Add preview components
- Show before/after comparison
- Playback controls

**Deliverables**:
- ✅ Preview original audio
- ✅ Preview processed vocals
- ✅ Audio player component

---

### Phase 3.3: Error Handling & Rate Limiting (Day 14)

**Goal**: Improve stability and prevent abuse

**Tasks**:
- Add express-rate-limit middleware
- Improve error handling in all layers
- Frontend error display
- Logging setup
- User-friendly error messages

**Deliverables**:
- ✅ Comprehensive error messages
- ✅ Rate limiting middleware
- ✅ User-friendly error UI

---

## Phase 4: User Features (Version 2.0) - Weeks 4-5

### Phase 4.1: Database & User Auth (Days 15-17)

**Goal**: Add user accounts and job history

**Setup**:
- PostgreSQL database
- User authentication (Clerk or Auth0)
- Database schema design

**Schema**:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE jobs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  input_filename VARCHAR(255),
  output_filename VARCHAR(255),
  status VARCHAR(50),
  progress INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
```

**Tasks**:
- Setup PostgreSQL
- Database schema (users, jobs)
- Integrate auth provider
- Protected routes
- Job history API

**Deliverables**:
- ✅ PostgreSQL database
- ✅ User authentication (Clerk/Auth0)
- ✅ Job history storage
- ✅ User-specific data

---

### Phase 4.2: Batch Processing (Days 18-19)

**Goal**: Allow users to process multiple files at once

**Tasks**:
- Update upload to accept multiple files
- Create batch job structure
- Track individual file progress
- Batch download option
- Frontend batch upload UI

**Deliverables**:
- ✅ Multiple file upload
- ✅ Batch job creation
- ✅ Individual file tracking

---

### Phase 4.3: Advanced Separation Options (Days 20-21)

**Goal**: Offer different separation modes

**Options**:
- Vocals only (existing)
- Music only (inverse)
- 4-stem separation (vocals, drums, bass, other)

**Tasks**:
- Update Python script for different modes
- Add separation type parameter
- Update API to accept mode
- Frontend mode selector
- Multiple download options

**Deliverables**:
- ✅ Vocals only (existing)
- ✅ Music only (inverse)
- ✅ 4-stem separation (vocals, drums, bass, other)

---

### Phase 4.4: Developer API (Day 22)

**Goal**: Provide API access for developers

**Tasks**:
- Create API key system
- Document endpoints
- Add API middleware
- Usage tracking
- Rate limits per key

**Deliverables**:
- ✅ API documentation
- ✅ API keys system
- ✅ Rate limits per key

---

## Phase 5: Future Enhancements (Post-MVP)

**Not scheduled, future considerations**:

- **Real-time Processing**: WebSocket progress updates instead of polling
- **YouTube Integration**: Direct YouTube URL processing
- **Cloud Storage**: Integrations with Google Drive, Dropbox
- **Subscription Model**: Tiered pricing for heavy users
- **Analytics**: PostHog integration for user analytics
- **Advanced Monitoring**: Sentry for error tracking

---

## 📊 Timeline Summary

| Phase | Duration | Key Deliverable |
|-------|----------|----------------|
| **Phase 1** | Week 1 (Days 1-4) | Working audio separation API |
| **Phase 2** | Week 2 (Days 5-10) | Full MVP with frontend, deployed |
| **Phase 3** | Week 3 (Days 11-14) | Video support + polish |
| **Phase 4** | Weeks 4-5 (Days 15-22) | User accounts + advanced features |
| **Phase 5** | Future | Additional enhancements |

**Total MVP Timeline**: 2 weeks (10 working days)
**Full Version 2.0 Timeline**: 5 weeks (22 working days)

---

## 🚀 Success Metrics

### Technical Metrics
- **Processing Time**: < 5 min for 3-min song
- **Uptime**: > 95%
- **Error Rate**: < 5%

### User Metrics
- **Upload Completion Rate**: > 80%
- **Download Rate**: > 70%
- **Repeat Usage**: Track with analytics

---

## 💡 Key Technical Decisions

### Why not pure TypeScript?
- AI models are Python-native
- Converting adds complexity
- Python script is 20 lines vs 200+ in TS

### Why job queue?
- Processing takes 2-5 minutes
- HTTP timeouts on free tier
- Better UX with progress updates

### Why Demucs over Spleeter?
- Better quality (state-of-the-art)
- Active development
- Can switch later if needed

### Why not serverless?
- Model is 300MB (cold start hell)
- Better to keep warm
- Simpler for MVP

---

## 📋 Dependencies Between Phases

```
Phase 1.1 (Python) → Phase 1.2 (Backend)
Phase 1.2 (Backend) → Phase 2.1 (Queue)
Phase 2.1 (Queue) → Phase 2.2 (Frontend)
Phase 2.2 (Frontend) → Phase 2.3 (Deploy)
Phase 2.3 (Deploy) → Phase 3+ (Enhancements)
```

Each phase builds on the previous one. The MVP (Phases 1-2) is the critical path to a working product.

---

## 🔧 Development Environment Setup

### Prerequisites
- Node.js 20+
- Python 3.11+
- Redis
- PostgreSQL (for Phase 4)
- Docker (for deployment)

### Local Development
1. Clone repository
2. Setup Python environment: `cd python-worker && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt`
3. Setup backend: `cd backend && npm install && npm run dev`
4. Setup frontend: `cd frontend && npm install && npm start`
5. Start Redis: `redis-server`

### Environment Variables
```env
# Backend
PORT=3000
NODE_ENV=development
REDIS_HOST=localhost
REDIS_PORT=6379
DATABASE_URL=postgresql://user:pass@localhost:5432/voiceisolate

# Storage (Phase 2+)
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=voiceisolate-files
```

---

## 📝 Notes & Considerations

### Resource Management
- Demucs model size (~300MB) requires adequate server resources
- Processing time varies by file length (estimate: 1-2x file duration)
- Storage cleanup: implement automatic deletion of temp files

### Error Handling
- Python process failures need graceful handling
- Network timeouts during upload/download
- Invalid file format detection
- User-friendly error messages

### Security
- File size limits (100MB initial)
- File type validation
- Rate limiting to prevent abuse
- Input sanitization

### Performance
- Consider caching for frequently processed files
- Optimize Python script for faster processing
- CDN for static assets (Phase 2+)

---

## 📚 Additional Resources

- [Demucs Documentation](https://github.com/facebookresearch/demucs)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [React Query Documentation](https://tanstack.com/query/latest)

---

**Document Version**: 1.0  
**Last Updated**: Initial creation  
**Status**: Planning phase

