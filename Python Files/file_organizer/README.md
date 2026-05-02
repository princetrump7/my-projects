# Smart CLI File Organizer

Robust Python CLI tool to automatically organize files into folders by type. Supports dry-run, recursive scan, exclusions, custom categories, history & undo.

## Features
- Extension-based + filename heuristics + content magic byte detection
- Symlink-safe, no loops
- Progress bar, per-category stats
- JSON history with full undo (last or confirm)
- Custom extensions via JSON
- Dry-run preview
- Flatten recursive scan excluding category subtrees

## Installation
```bash
pip install -r requirements.txt  # only pytest for tests
```

## Usage
```bash
python file_organizer.py /path/to/folder [options]
```

### Options
- `--dry-run`: Preview moves without changing files
- `--flatten`: Recursively scan subdirectories
- `--exclude *.tmp --exclude 'backup*'` : Glob patterns to skip (repeatable)
- `--config extensions.json`: Custom categories
- `--verbose -v`: Debug logs
- `--undo`: Revert the last run (interactive confirm)
- `--log-file app.log`: Log to file
- `python file_organizer.py --help`: Full help

### Examples
```bash
# Quick organize Downloads
python file_organizer.py ~/Downloads --dry-run

# Full recursive with excludes
python file_organizer.py ~/Pictures --flatten --exclude thumbs.db --verbose

# Custom categories
python file_organizer.py . --config my_extensions.json

# Undo last
python file_organizer.py . --undo
```

## Categories (DEFAULT_EXTENSIONS)
Images, Documents, Audio, Videos, Archives, Scripts, Data, Executables, Fonts, Others.

Customize in `extensions.json` sample provided.

## History
Runs logged to `./.organize_history.json` (JSONL). Undo restores exactly.

## Testing
```bash
pip install -r requirements.txt
pytest tests/
```

## Improvements Made
- Pathlib everywhere
- Symlink handling
- Content-based fallback (JPEG/PDF/etc magic bytes)
- Filename heuristics
- Progress indicator
- Stats summary
- Full CLI with argparse
- History/undo system
- Error resilience

Stdlib-only runtime (no deps).
