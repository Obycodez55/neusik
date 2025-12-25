#!/usr/bin/env python3
"""
Test suite for Neusik audio separation script.
"""

import unittest
import json
import tempfile
import shutil
from pathlib import Path
from unittest.mock import patch, MagicMock
import sys

# Add parent directory to path to import separate module
sys.path.insert(0, str(Path(__file__).parent))

from separate import (
    process_audio,
    validate_input_file,
    validate_output_dir,
    get_file_format,
    FileNotFoundError,
    InvalidFormatError,
    FileSizeError,
    PermissionError,
    ProcessingError,
    MAX_FILE_SIZE_BYTES,
    SUPPORTED_FORMATS
)


class TestFormatDetection(unittest.TestCase):
    """Test file format detection."""
    
    def test_supported_formats(self):
        """Test that all supported formats are detected correctly."""
        test_cases = [
            ('test.mp3', 'mp3'),
            ('test.wav', 'wav'),
            ('test.m4a', 'm4a'),
            ('test.flac', 'flac'),
            ('test.ogg', 'ogg'),
            ('test.aac', 'aac'),
        ]
        
        for filename, expected_format in test_cases:
            with self.subTest(filename=filename):
                file_path = Path(filename)
                result = get_file_format(file_path)
                self.assertEqual(result, expected_format)
    
    def test_unsupported_format(self):
        """Test that unsupported formats return None."""
        file_path = Path('test.txt')
        result = get_file_format(file_path)
        self.assertIsNone(result)
    
    def test_case_insensitive(self):
        """Test that format detection is case-insensitive."""
        file_path = Path('test.MP3')
        result = get_file_format(file_path)
        self.assertEqual(result, 'mp3')


class TestInputValidation(unittest.TestCase):
    """Test input file validation."""
    
    def setUp(self):
        """Create temporary test file."""
        self.temp_dir = tempfile.mkdtemp()
        self.test_file = Path(self.temp_dir) / 'test.mp3'
        self.test_file.write_bytes(b'fake mp3 content')
    
    def tearDown(self):
        """Clean up temporary files."""
        shutil.rmtree(self.temp_dir)
    
    def test_valid_file(self):
        """Test validation of a valid file."""
        file_path, file_info = validate_input_file(str(self.test_file))
        self.assertEqual(file_path, self.test_file)
        self.assertEqual(file_info['format'], 'mp3')
        self.assertIn('size', file_info)
        self.assertIn('name', file_info)
    
    def test_file_not_found(self):
        """Test that missing file raises FileNotFoundError."""
        with self.assertRaises(FileNotFoundError):
            validate_input_file('/nonexistent/file.mp3')
    
    def test_unsupported_format(self):
        """Test that unsupported format raises InvalidFormatError."""
        txt_file = Path(self.temp_dir) / 'test.txt'
        txt_file.write_text('not audio')
        
        with self.assertRaises(InvalidFormatError):
            validate_input_file(str(txt_file))
    
    def test_file_too_large(self):
        """Test that oversized file raises FileSizeError."""
        large_file = Path(self.temp_dir) / 'large.mp3'
        # Create a file larger than MAX_FILE_SIZE_BYTES
        large_file.write_bytes(b'x' * (MAX_FILE_SIZE_BYTES + 1))
        
        with self.assertRaises(FileSizeError):
            validate_input_file(str(large_file))


class TestOutputValidation(unittest.TestCase):
    """Test output directory validation."""
    
    def setUp(self):
        """Create temporary directory."""
        self.temp_dir = tempfile.mkdtemp()
    
    def tearDown(self):
        """Clean up temporary files."""
        shutil.rmtree(self.temp_dir)
    
    def test_create_output_dir(self):
        """Test that output directory is created if it doesn't exist."""
        new_dir = Path(self.temp_dir) / 'new_output'
        result = validate_output_dir(str(new_dir))
        self.assertTrue(new_dir.exists())
        self.assertTrue(new_dir.is_dir())
    
    def test_existing_output_dir(self):
        """Test validation of existing output directory."""
        existing_dir = Path(self.temp_dir) / 'existing'
        existing_dir.mkdir()
        
        result = validate_output_dir(str(existing_dir))
        self.assertEqual(result, existing_dir)


class TestProcessAudio(unittest.TestCase):
    """Test audio processing function."""
    
    def setUp(self):
        """Set up test environment."""
        self.temp_dir = tempfile.mkdtemp()
        self.test_file = Path(self.temp_dir) / 'test.mp3'
        self.test_file.write_bytes(b'fake mp3 content')
        self.output_dir = Path(self.temp_dir) / 'output'
    
    def tearDown(self):
        """Clean up temporary files."""
        shutil.rmtree(self.temp_dir)
    
    @patch('separate.separate_main')
    def test_successful_processing(self, mock_separate):
        """Test successful audio processing."""
        # Mock Demucs to create expected output structure
        def mock_separate_side_effect(args):
            output_path = Path(args[args.index('-o') + 1])
            vocals_dir = output_path / 'htdemucs' / 'test'
            vocals_dir.mkdir(parents=True)
            (vocals_dir / 'vocals.mp3').write_bytes(b'fake vocals')
        
        mock_separate.side_effect = mock_separate_side_effect
        
        result = process_audio(str(self.test_file), str(self.output_dir))
        
        self.assertEqual(result['status'], 'success')
        self.assertIn('input', result)
        self.assertIn('output', result)
        self.assertIn('processing', result)
        self.assertEqual(result['input']['format'], 'mp3')
        self.assertEqual(result['output']['format'], 'mp3')
    
    def test_file_not_found_error(self):
        """Test error handling for missing file."""
        result = process_audio('/nonexistent/file.mp3', str(self.output_dir))
        
        self.assertEqual(result['status'], 'error')
        self.assertIn('message', result)
        self.assertEqual(result['error_type'], 'FileNotFoundError')
    
    def test_invalid_format_error(self):
        """Test error handling for invalid format."""
        txt_file = Path(self.temp_dir) / 'test.txt'
        txt_file.write_text('not audio')
        
        result = process_audio(str(txt_file), str(self.output_dir))
        
        self.assertEqual(result['status'], 'error')
        self.assertEqual(result['error_type'], 'InvalidFormatError')
    
    @patch('separate.separate_main')
    def test_processing_error(self, mock_separate):
        """Test error handling when Demucs processing fails."""
        mock_separate.side_effect = Exception('Demucs error')
        
        result = process_audio(str(self.test_file), str(self.output_dir))
        
        self.assertEqual(result['status'], 'error')
        self.assertEqual(result['error_type'], 'ProcessingError')
        self.assertIn('Demucs processing failed', result['message'])


class TestErrorMessages(unittest.TestCase):
    """Test that error messages are informative."""
    
    def test_file_not_found_message(self):
        """Test FileNotFoundError message."""
        error = FileNotFoundError('test.mp3')
        self.assertIn('test.mp3', str(error))
    
    def test_invalid_format_message(self):
        """Test InvalidFormatError message includes supported formats."""
        # Create a file with unsupported extension
        temp_dir = tempfile.mkdtemp()
        try:
            txt_file = Path(temp_dir) / 'test.xyz'
            txt_file.write_text('not audio')
            
            try:
                validate_input_file(str(txt_file))
                self.fail('Should have raised InvalidFormatError')
            except InvalidFormatError as e:
                message = str(e)
                # Should mention supported formats
                self.assertIn('Supported formats', message)
        finally:
            shutil.rmtree(temp_dir)


class TestJSONOutput(unittest.TestCase):
    """Test JSON output format."""
    
    def setUp(self):
        """Set up test environment."""
        self.temp_dir = tempfile.mkdtemp()
        self.test_file = Path(self.temp_dir) / 'test.mp3'
        self.test_file.write_bytes(b'fake mp3 content')
        self.output_dir = Path(self.temp_dir) / 'output'
    
    def tearDown(self):
        """Clean up temporary files."""
        shutil.rmtree(self.temp_dir)
    
    @patch('separate.separate_main')
    def test_json_output_structure(self, mock_separate):
        """Test that output is valid JSON with expected structure."""
        def mock_separate_side_effect(args):
            output_path = Path(args[args.index('-o') + 1])
            vocals_dir = output_path / 'htdemucs' / 'test'
            vocals_dir.mkdir(parents=True)
            (vocals_dir / 'vocals.mp3').write_bytes(b'fake vocals')
        
        mock_separate.side_effect = mock_separate_side_effect
        
        result = process_audio(str(self.test_file), str(self.output_dir))
        
        # Test JSON serialization
        json_str = json.dumps(result)
        parsed = json.loads(json_str)
        
        self.assertEqual(parsed['status'], 'success')
        self.assertIn('input', parsed)
        self.assertIn('output', parsed)
        self.assertIn('processing', parsed)
        self.assertIn('warnings', parsed)


def run_tests():
    """Run all tests."""
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # Add all test classes
    suite.addTests(loader.loadTestsFromTestCase(TestFormatDetection))
    suite.addTests(loader.loadTestsFromTestCase(TestInputValidation))
    suite.addTests(loader.loadTestsFromTestCase(TestOutputValidation))
    suite.addTests(loader.loadTestsFromTestCase(TestProcessAudio))
    suite.addTests(loader.loadTestsFromTestCase(TestErrorMessages))
    suite.addTests(loader.loadTestsFromTestCase(TestJSONOutput))
    
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    return result.wasSuccessful()


if __name__ == '__main__':
    success = run_tests()
    sys.exit(0 if success else 1)

