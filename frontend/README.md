# Neusik Frontend

Next.js frontend application for Neusik - AI-powered audio separation to isolate vocals from background music.

## Features

- Modern React with Next.js 16 (App Router)
- TypeScript for type safety
- Tailwind CSS for styling
- File upload with drag & drop support (Phase 2)
- Real-time progress tracking (Phase 2)
- Download processed audio files (Phase 2)

## Prerequisites

- Node.js 20+
- npm or yarn
- Backend API running (see `../backend/README.md`)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the frontend directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Note**: Next.js requires the `NEXT_PUBLIC_` prefix for environment variables that need to be accessible in the browser.

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Home page
│   └── globals.css         # Global styles with Tailwind
├── components/
│   ├── Layout/             # Layout components
│   │   ├── Header.tsx
│   │   └── Container.tsx
│   ├── Upload/             # Upload components (Phase 2)
│   ├── Progress/           # Progress components (Phase 2)
│   └── Download/           # Download components (Phase 2)
├── lib/
│   └── api.ts              # API client
├── types/
│   └── index.ts            # TypeScript type definitions
├── utils/
│   └── constants.ts        # Application constants
└── public/                 # Static assets
```

## Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3000` |

## Development

### TypeScript

The project uses TypeScript with strict mode enabled. Type checking is done automatically during build.

### Styling

Tailwind CSS is configured and ready to use. The project uses the new Tailwind CSS v4 syntax with `@import "tailwindcss"` in `globals.css`.

### Path Aliases

Use `@/` prefix for imports from the project root:

```typescript
import Header from '@/components/Layout/Header';
import { uploadFile } from '@/lib/api';
import { JobStatus } from '@/types';
```

### Client Components

Components that use React hooks or browser APIs need the `'use client'` directive:

```typescript
'use client';

import { useState } from 'react';
```

## Next Steps

- **Phase 2**: Implement file upload with react-dropzone
- **Phase 2**: Add progress tracking with polling
- **Phase 2**: Implement download functionality
- **Phase 3**: Add audio preview components
- **Phase 4**: Docker and deployment setup

## Troubleshooting

### Build Errors

- Ensure all dependencies are installed: `npm install`
- Check TypeScript errors: `npx tsc --noEmit`
- Verify environment variables are set correctly

### API Connection Issues

- Ensure backend is running on the configured port
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Verify CORS is configured in backend

### Styling Issues

- Tailwind CSS is pre-configured with Next.js
- Check `globals.css` for Tailwind directives
- Verify classes are not purged (check `tailwind.config.ts`)

## License

ISC
