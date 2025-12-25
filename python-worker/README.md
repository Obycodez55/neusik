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

### Output Structure

The script will create the following structure:
```
output/
└── htdemucs/
    └── [input-filename]/
        └── vocals.mp3
```

### JSON Output Format

#### Success Response

The script outputs detailed JSON to stdout on success:

```json
{
  "status": "success",
  "input": {
    "path": "/path/to/song.mp3",
    "name": "song.mp3",
    "size": 1234567,
    "format": "mp3"
  },
  "output": {
    "path": "output/htdemucs/song/vocals.mp3",
    "size": 987654,
    "format": "mp3"
  },
  "processing": {
    "time_seconds": 45.2,
    "model": "htdemucs"
  },
  "warnings": []
}
```

#### Error Response

On error, the script returns:

```json
{
  "status": "error",
  "message": "Error description",
  "error_type": "FileNotFoundError",
  "processing": {
    "time_seconds": 0.1
  }
}
```

## Supported Formats

The following audio formats are supported:

- **MP3** (.mp3)
- **WAV** (.wav)
- **M4A** (.m4a)
- **FLAC** (.flac)
- **OGG** (.ogg)
- **AAC** (.aac)
- **MP4** (.mp4) - audio tracks

Format detection is case-insensitive (e.g., `.MP3` is recognized).

## Configuration

The script uses the following Demucs settings:

- **Model**: `htdemucs` (default, automatically downloaded on first use)
- **Output format**: MP3
- **Bitrate**: 256 kbps
- **Stems**: Vocals only (two-stem mode)
- **Max file size**: 500MB (configurable in script)

## Error Types

The script uses specific error types for better error handling:

### FileNotFoundError
- **Cause**: Input file does not exist
- **Solution**: Verify file path is correct, use absolute paths if needed

### InvalidFormatError
- **Cause**: File format is not supported
- **Solution**: Convert file to a supported format (MP3, WAV, M4A, FLAC, OGG, AAC)

### FileSizeError
- **Cause**: File exceeds maximum size limit (500MB default)
- **Solution**: Use a smaller file or increase the limit in the script

### PermissionError
- **Cause**: Cannot read input file or write to output directory
- **Solution**: Check file/directory permissions, ensure write access

### ProcessingError
- **Cause**: Demucs processing failed (model error, corrupted file, etc.)
- **Solution**: Verify file is a valid audio file, check disk space, try again

## Validation

The script performs comprehensive validation:

### Input File Validation
- File exists and is readable
- Valid audio format (extension check)
- File size within limits (500MB default)
- Not a directory

### Output Directory Validation
- Directory exists or can be created
- Directory is writable
- Sufficient disk space (warns if <100MB free)

## Logging

The script includes logging for debugging and monitoring:

- **INFO**: File validation, processing start/completion
- **WARNING**: Low disk space, potential issues
- **ERROR**: Processing failures, validation errors

Logs are output to stderr and include timestamps and log levels.

## Testing

Run the test suite to verify functionality:

```bash
python test_separation.py
```

The test suite includes:
- Format detection tests
- Input validation tests
- Output validation tests
- Error handling tests
- JSON output structure tests

## Performance Expectations

- **Processing time**: Approximately 1-2x the audio file duration
  - 3-minute song: 3-6 minutes
  - 5-minute song: 5-10 minutes
- **First run**: Slower due to model download (~300MB)
- **Memory usage**: 2GB+ RAM recommended
- **Disk space**: 
  - Model files: ~300MB (one-time download)
  - Output files: Similar size to input files

## Troubleshooting

### "Input file not found"
- Verify the file path is correct
- Use absolute paths if relative paths don't work
- Check file permissions (must be readable)

### "Unsupported file format"
- Check file extension matches supported formats
- Verify file is actually an audio file (not renamed text file)
- Convert to MP3, WAV, or another supported format

### "File too large"
- Default limit is 500MB
- Split large files or increase limit in script (modify `MAX_FILE_SIZE_MB`)

### "Cannot read file (permission denied)"
- Check file permissions: `chmod 644 filename.mp3`
- Ensure you have read access to the file

### "Cannot create output directory"
- Check parent directory permissions
- Ensure you have write access to the parent directory
- Try creating the directory manually first

### "Output file not found after processing"
- Check that the output directory is writable
- Verify sufficient disk space
- Check for processing errors in logs
- Ensure Demucs model downloaded successfully

### "Demucs processing failed"
- Verify file is a valid, uncorrupted audio file
- Check disk space (need space for model + output)
- Ensure Python environment has all dependencies
- Try with a different audio file to isolate the issue

### Import errors
- Ensure virtual environment is activated
- Reinstall dependencies: `pip install -r requirements.txt`
- Verify Python version: `python --version` (should be 3.11+)

### Processing is slow
- This is normal - processing time is typically 1-2x audio duration
- First run is slower due to model download
- Consider using shorter audio clips for testing
- Ensure adequate CPU and RAM resources

### Low disk space warning
- Script warns if <100MB free space available
- Ensure sufficient space for output files
- Clean up old output files if needed

## Exit Codes

- `0`: Success - audio processed successfully
- `1`: Error - processing failed (check JSON output for details)

## Integration

This script is designed to be called from the Neusik backend API. It:

- Accepts command-line arguments (input file, output directory)
- Outputs JSON results to stdout for easy parsing
- Uses exit codes for success/failure indication
- Includes comprehensive error handling
- Provides detailed logging for debugging

### Example Integration

```python
import subprocess
import json

result = subprocess.run(
    ['python', 'separate.py', 'input.mp3', './output'],
    capture_output=True,
    text=True
)

if result.returncode == 0:
    data = json.loads(result.stdout)
    if data['status'] == 'success':
        print(f"Output: {data['output']['path']}")
    else:
        print(f"Error: {data['message']}")
else:
    print("Process failed")
```

## Code Quality

The script includes:
- Type hints for better maintainability
- Comprehensive docstrings
- Custom exception classes for specific error types
- Logging for debugging and monitoring
- Input validation and error handling
- Test suite for validation

## Limitations

- Maximum file size: 500MB (configurable)
- Output format: MP3 only (256 kbps)
- Stems: Vocals only (two-stem mode)
- Processing time scales with file duration
- Requires significant RAM (2GB+ recommended)

## Future Enhancements

Potential improvements:
- Support for additional output formats (WAV, FLAC)
- Multiple stem separation (vocals, drums, bass, other)
- Progress callbacks for long-running processes
- Configurable bitrate and quality settings
- Batch processing support
