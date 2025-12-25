# Neusik Python Worker

Audio separation worker using Demucs AI to isolate vocals from background music.

## Setup

### Prerequisites
- Python 3.11 or higher
- pip (Python package manager)

### Installation

1. **Create and activate virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On macOS/Linux
   # or
   venv\Scripts\activate     # On Windows
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

   Or install directly:
   ```bash
   pip install demucs
   ```

3. **Verify installation:**
   ```bash
   python -c "import demucs; print('Demucs installed successfully')"
   ```

## Usage

### Basic Usage

```bash
python separate.py <input_file> <output_dir>
```

### Examples

```bash
# Process an MP3 file
python separate.py song.mp3 ./output

# Process a WAV file
python separate.py recording.wav ./results

# Process with absolute paths
python separate.py /path/to/audio.mp3 /path/to/output
```

### Output

The script will create the following structure:
```
output/
└── htdemucs/
    └── [input-filename]/
        └── vocals.mp3
```

The script outputs JSON to stdout:
```json
{
  "status": "success",
  "output_path": "output/htdemucs/song/vocals.mp3",
  "size": 1234567
}
```

Or on error:
```json
{
  "status": "error",
  "message": "Error description"
}
```

## Supported Formats

- MP3
- WAV
- M4A
- FLAC
- And other formats supported by Demucs

## Configuration

The script uses the following Demucs settings:
- **Model**: htdemucs (default, automatically downloaded on first use)
- **Output format**: MP3
- **Bitrate**: 256 kbps
- **Stems**: Vocals only (two-stem mode)

## Notes

- **First run**: The Demucs model (~300MB) will be automatically downloaded on first use
- **Processing time**: Approximately 1-2x the audio file duration (e.g., 3-minute song takes 3-6 minutes)
- **Disk space**: Ensure sufficient space for:
  - Model files (~300MB)
  - Output files (similar size to input)
- **Memory**: Processing requires adequate RAM (2GB+ recommended)

## Troubleshooting

### "Input file not found"
- Verify the file path is correct
- Use absolute paths if relative paths don't work
- Check file permissions

### "Output file not found after processing"
- Check that the output directory is writable
- Verify sufficient disk space
- Check for processing errors in stderr

### Import errors
- Ensure virtual environment is activated
- Reinstall dependencies: `pip install -r requirements.txt`
- Verify Python version: `python --version` (should be 3.11+)

### Processing is slow
- This is normal - processing time is typically 1-2x audio duration
- First run is slower due to model download
- Consider using shorter audio clips for testing

## Exit Codes

- `0`: Success
- `1`: Error (file not found, processing failed, etc.)

## Integration

This script is designed to be called from the Neusik backend API. It accepts command-line arguments and outputs JSON results for easy parsing.

