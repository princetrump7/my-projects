import argparse
import os
import shutil
from pathlib import Path


CATEGORY_MAP = {
    "Documents": {".pdf", ".doc", ".docx", ".txt", ".xls", ".xlsx", ".ppt", ".pptx", ".csv", ".rtf", ".odt"},
    "Images": {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".svg", ".webp", ".ico", ".tiff"},
    "Videos": {".mp4", ".mkv", ".avi", ".mov", ".wmv", ".flv", ".webm"},
    "Audio": {".mp3", ".wav", ".flac", ".aac", ".ogg", ".wma", ".m4a"},
    "Archives": {".zip", ".rar", ".7z", ".tar", ".gz", ".bz2", ".xz"},
    "Code": {".py", ".js", ".ts", ".java", ".c", ".cpp", ".h", ".cs", ".go", ".rs", ".rb", ".php", ".html", ".css", ".json", ".xml", ".yaml", ".yml"},
}


def get_category(extension):
    for category, extensions in CATEGORY_MAP.items():
        if extension.lower() in extensions:
            return category
    return "Other"


def organize(path, dry_run=False):
    target = Path ("C:\Users\princ\OneDrive\Desktop\lectures")

    if not target.exists():
        print(f"Error: Path '{path}' does not exist.")
        return

    if not target.is_dir():
        print(f"Error: Path '{path}' is not a directory.")
        return

    files = [f for f in target.iterdir() if f.is_file()]
    moved = 0

    for file in files:
        category = get_category(file.suffix)
        dest_dir = target / category
        dest_file = dest_dir / file.name

        if dry_run:
            print(f"[DRY RUN] Would move: {file.name} -> {category}/")
        else:
            dest_dir.mkdir(exist_ok=True)
            shutil.move(str(file), str(dest_file))
            print(f"Moved: {file.name} -> {category}/")

        moved += 1

    action = "would be moved" if dry_run else "moved"
    print(f"\nDone. {moved} file(s) {action}.")


def main():
    parser = argparse.ArgumentParser(description="Organize files into folders by extension.")
    parser.add_argument("--path", required=True, help="Directory path to organize.")
    parser.add_argument("--dry-run", action="store_true", help="Preview changes without moving files.")

    args = parser.parse_args()
    organize(args.path, args.dry_run)


if __name__ == "__main__":
    main()
