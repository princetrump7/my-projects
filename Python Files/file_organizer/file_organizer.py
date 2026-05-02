import os
import shutil
import json
import logging
import argparse
import fnmatch
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime
from pathlib import Path

DEFAULT_EXTENSIONS = {
    "Images": [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".svg", ".webp", ".ico", ".heic"],
    "Documents": [".pdf", ".doc", ".docx", ".txt", ".xls", ".xlsx", ".ppt", ".pptx", ".odt", ".ods", ".odp", ".csv", ".rtf", ".md"],
    "Audio": [".mp3", ".wav", ".aac", ".flac", ".ogg", ".wma", ".m4a"],
    "Videos": [".mp4", ".avi", ".mov", ".mkv", ".wmv", ".flv", ".webm", ".m4v"],
    "Archives": [".zip", ".rar", ".tar", ".gz", ".7z", ".bz2", ".xz", ".iso"],
    "Scripts": [".py", ".js", ".ts", ".sh", ".bat", ".rb", ".ps1", ".go", ".rs", ".java", ".c", ".cpp", ".h"],
    "Data": [".json", ".xml", ".yaml", ".yml", ".toml", ".ini", ".cfg", ".conf", ".sql", ".db"],
    "Executables": [".exe", ".msi", ".dmg", ".apk", ".deb", ".rpm"],
    "Fonts": [".ttf", ".otf", ".woff", ".woff2", ".eot"],
}

HISTORY_FILE = Path(".organize_history.json")
logger = logging.getLogger(__name__)

def setup_logging(verbose: bool = False, log_file: Optional[Path] = None) -> None:
    level = logging.DEBUG if verbose else logging.INFO
    handlers: List[logging.Handler] = [logging.StreamHandler()]
    if log_file:
        handlers.append(logging.FileHandler(str(log_file)))
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        handlers=handlers,
    )

def get_unique_path(dest_dir: Path, filename: str) -> Path:
    dest_path = dest_dir / filename
    if not dest_path.exists():
        return dest_path
    stem, ext = dest_path.stem, dest_path.suffix
    counter = 1
    while True:
        candidate = dest_dir / f"{stem}_{counter}{ext}"
        if not candidate.exists():
            return candidate
        counter += 1

def organize_folder(
    path: Path,
    extensions: Optional[Dict[str, List[str]]] = None,
    dry_run: bool = False,
    flatten: bool = False,
    exclude_patterns: List[str] = [],
    by_date: bool = False,
    by_size: bool = False,
    limit: Optional[int] = None,
) -> Dict[str, Any]:
    from collections import Counter

    extensions = extensions or DEFAULT_EXTENSIONS
    path = path.resolve()
    if not path.is_dir():
        raise ValueError(f"Path is not a directory: {path}")
    
    if by_date and by_size:
        raise ValueError("Cannot use both --by-date and --by-size")

    # Protected category folders (case-insensitive)
    category_bases = {cat.lower() for cat in extensions}
    category_bases.add("others")

    all_files: List[Path] = []
    if flatten:
        for root, dirs, files in os.walk(str(path)):
            root_path = Path(root)
            rel_path = root_path.relative_to(path)
            if any(part.lower() in category_bases for part in rel_path.parts):
                dirs[:] = []
                continue
            for f in files:
                file_path = root_path / f
                if file_path.is_symlink():
                    continue
                all_files.append(file_path)
    else:
        for item in path.iterdir():
            if item.is_file() and not item.is_symlink():
                all_files.append(item)

    stats = Counter()
    moved_files = []
    skipped = 0
    error_files = []

    if limit:
        all_files = all_files[:limit]
    
    total = len(all_files)
    for i, filepath in enumerate(all_files):
        if i % 100 == 0 or i == total - 1:
            print(f"Processed {i + 1}/{total} files...", end='\r')

        filename = filepath.name
        
        if filename.startswith('.') or filename == 'organize_history.json':
            skipped += 1
            continue
        
        if any(fnmatch.fnmatch(filename, pat) for pat in exclude_patterns):
            logger.debug(f"Excluded: {filename}")
            skipped += 1
            continue

        if by_date:
            category = get_date_category(filepath)
        elif by_size:
            category = get_size_category(filepath)
        else:
            category = determine_category(filepath, extensions)
        stats[category] += 1
        
        dest_dir = path / category
        target_path = get_unique_path(dest_dir, filename)

        if filepath.parent == dest_dir:
            skipped += 1
            continue

        if dry_run:
            logger.info(f"[DRY RUN] {filename} -> {category}/")
            moved_files.append({"source": str(filepath), "destination": str(target_path)})
            continue

        try:
            dest_dir.mkdir(parents=True, exist_ok=True)
            shutil.move(str(filepath), str(target_path))
            logger.info(f"Moved: {filename} -> {category}/")
            moved_files.append({"source": str(filepath), "destination": str(target_path)})
        except Exception as e:
            logger.error(f"Error moving {filename}: {e}")
            error_files.append(filename)

    print(f"\nSummary: {len(moved_files)} moved, {skipped} skipped, {len(error_files)} errors")
    logger.info(f"Stats: {dict(stats)}")
    return {
        "path": str(path),
        "moved": moved_files,
        "skipped": skipped,
        "errors": error_files,
        "stats": dict(stats)
    }

def get_date_category(filepath: Path) -> str:
    try:
        mtime = filepath.stat().st_mtime
        dt = datetime.fromtimestamp(mtime)
        return f"{dt.year}/{dt.month:02d}"
    except OSError:
        return "Unknown"

def get_size_category(filepath: Path) -> str:
    try:
        size = filepath.stat().st_size
        if size < 1024 * 1024:
            return "Small (<1MB)"
        elif size < 100 * 1024 * 1024:
            return "Medium (1-100MB)"
        else:
            return "Large (>100MB)"
    except OSError:
        return "Unknown"

def determine_category(filepath: Path, extensions: Dict[str, List[str]]) -> str:
    filename_lower = filepath.name.lower()
    ext = filepath.suffix.lower()
    
    for cat, ext_list in extensions.items():
        if ext in ext_list:
            return cat
    
    image_keywords = {"photo", "image", "pic", "img", "screenshot", "screen"}
    doc_keywords = {"doc", "document", "report", "note", "memo"}
    if any(kw in filename_lower for kw in image_keywords):
        return "Images"
    if any(kw in filename_lower for kw in doc_keywords):
        return "Documents"
    
    try:
        with filepath.open("rb") as f:
            header = f.read(8)
            if header.startswith(b'\xff\xd8\xff'):
                return "Images"  # JPEG
            if header.startswith(b'%PDF'):
                return "Documents"  # PDF
            if header.startswith(b'GIF8'):
                return "Images"  # GIF
            if header.startswith(b'\x89PNG'):
                return "Images"  # PNG
    except OSError:
        pass
    
    return "Others"

def save_history(result: Dict[str, Any], history_file: Path) -> str:
    run_id = str(uuid.uuid4())
    entry = {
        'run_id': run_id,
        'timestamp': datetime.now().isoformat(),
        'path': result['path'],
        'moved': result['moved'],
        'stats': result['stats']
    }
    history_file.parent.mkdir(exist_ok=True)
    with history_file.open('a', encoding='utf-8') as f:
        f.write(json.dumps(entry) + '\n')
    logger.info(f"Saved history run ID: {run_id[:8]}")
    return run_id

def load_history(history_file: Path) -> List[Dict[str, Any]]:
    if not history_file.exists():
        return []
    lines = history_file.read_text(encoding='utf-8').strip().split('\n')
    return [json.loads(line) for line in lines if line.strip()]

def undo_last(path: Path, history_file: Path, confirm: bool = True, run_id: Optional[str] = None) -> bool:
    history = load_history(history_file)
    if not history:
        logger.warning("No history to undo")
        return False
    
    if run_id:
        target = next((h for h in reversed(history) if h['run_id'][:8] == run_id or h['run_id'] == run_id), None)
        if not target:
            logger.warning(f"Run ID {run_id} not found")
            return False
    else:
        target = history[-1]
    
    logger.info(f"Undoing run {target['run_id'][:8]} ({target['timestamp'][:19]})")
    if confirm:
        logger.info("Auto-undo enabled, skipping confirm")
    moved = target['moved']
    success_count = 0
    for item in reversed(moved):
        src = Path(item['source'])
        dst = Path(item['destination'])
        try:
            if dst.exists() and not src.exists():
                shutil.move(str(dst), str(src))
                success_count += 1
        except Exception as e:
            logger.error(f"Undo failed for {dst}: {e}")
    if success_count == len(moved):
        history = [h for h in history if h['run_id'] != target['run_id']]
        with history_file.open('w', encoding='utf-8') as f:
            for entry in history:
                f.write(json.dumps(entry) + '\n')
        logger.info(f"Successfully undid {success_count} files")
        return True
    logger.error("Partial undo - history not updated")
    return False

def main() -> None:
    parser = argparse.ArgumentParser(description="Smart File Organizer by extension")
    parser.add_argument("path", type=str, nargs="?", default=None, help="Directory to organize")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be done")
    parser.add_argument("--flatten", action="store_true", help="Scan recursively")
    parser.add_argument("--exclude", action="append", default=[], help="Exclude glob pattern (repeatable)")
    parser.add_argument("--config", type=str, help="Custom extensions JSON file")
    parser.add_argument("--verbose", "-v", action="store_true")
    parser.add_argument("--undo", action="store_true", help="Undo the last organize run")
    parser.add_argument("--undo-id", type=str, help="Undo a specific run by ID")
    parser.add_argument("--log-file", type=str, help="Log output file")
    parser.add_argument("--by-date", action="store_true", help="Organize by date (year/month folders)")
    parser.add_argument("--by-size", action="store_true", help="Organize by size (small/medium/large)")
    parser.add_argument("--limit", type=int, help="Limit number of files to process")
    args = parser.parse_args()
    
    setup_logging(args.verbose, Path(args.log_file) if args.log_file else None)
    
    if args.path is None:
        args.path = input("Enter directory path to organize (Enter for current dir): ").strip()
    if not args.path:
        args.path = "."
    
    path_obj = Path(args.path).resolve()
    hist_file = path_obj / HISTORY_FILE
    
    extensions = DEFAULT_EXTENSIONS.copy()
    if args.config:
        try:
            with open(args.config, 'r') as f:
                custom = json.load(f)
                extensions.update(custom)
        except Exception as e:
            logger.error(f"Failed to load config: {e}")

    if args.undo:
        success = undo_last(path_obj, hist_file, run_id=args.undo_id)
        print(f"Undo {'succeeded' if success else 'failed'}")
        return

    try:
        result = organize_folder(
            path_obj,
            extensions,
            args.dry_run,
            args.flatten,
            args.exclude,
            args.by_date,
            args.by_size,
            args.limit
        )
        if not args.dry_run:
            save_history(result, hist_file)
        print("Final stats:")
        print(json.dumps(result['stats'], indent=2))
    except ValueError as e:
        logger.error(e)
        exit(1)

if __name__ == "__main__":
    main()

