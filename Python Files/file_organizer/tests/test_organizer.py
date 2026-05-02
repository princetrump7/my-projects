import pytest
import json
import shutil
from pathlib import Path
from file_organizer import (
    organize_folder,
    get_unique_path,
    determine_category,
    DEFAULT_EXTENSIONS,
    HISTORY_FILE
)

@pytest.fixture
def temp_dir(tmp_path):
    return tmp_path / "test_org"
    
def test_get_unique_path(temp_dir):
    temp_dir.mkdir()
    (temp_dir / "test.jpg").touch()
    images_dir = temp_dir / "Images"
    images_dir.mkdir()
    unique = get_unique_path(images_dir, "test.jpg")
    assert unique.name == "test.jpg"
    (images_dir / "test.jpg").touch()
    unique2 = get_unique_path(images_dir, "test.jpg")
    assert unique2.name == "test_1.jpg"

def test_organize_dry_run(temp_dir):
    temp_dir.mkdir()
    (temp_dir / "doc.pdf").touch()
    (temp_dir / "photo.jpg").touch()
    (temp_dir / ".hidden").touch()
    
    result = organize_folder(temp_dir, dry_run=True)
    assert len(result["moved"]) == 2
    assert result["skipped"] == 1
    assert "pdf" in result["stats"]["Documents"]
    assert "jpg" in result["stats"]["Images"]

def test_symlink_skip(temp_dir):
    temp_dir.mkdir()
    link = temp_dir / "link.txt"
    real = temp_dir / "real.txt"
    real.touch()
    link.symlink_to(real)
    
    result = organize_folder(temp_dir, flatten=True, dry_run=True)
    assert len(result["moved"]) == 1  # real only, skip symlink
    assert result["skipped"] == 1  # symlink

def test_determine_category_no_ext(temp_dir):
    temp_dir.mkdir()
    (temp_dir / "myphoto").touch()
    cat = determine_category(temp_dir / "myphoto", DEFAULT_EXTENSIONS)
    assert cat == "Images"  # heuristic

def test_content_detection(temp_dir):
    temp_dir.mkdir()
    pdf_content = b"%PDF-1.4"
    with open(temp_dir / "test_noext", "wb") as f:
        f.write(pdf_content)
    cat = determine_category(temp_dir / "test_noext", DEFAULT_EXTENSIONS)
    assert cat == "Documents"

def test_history_undo(temp_dir):
    temp_dir.mkdir()
    hist_file = temp_dir / HISTORY_FILE
    (temp_dir / "file.pdf").touch()
    
    # Dry run first
    result = organize_folder(temp_dir, dry_run=True)
    run_id = save_history(result, hist_file)  # from file_organizer but for test
    
    # Simulate move for undo test
    shutil.move(str(temp_dir / "file.pdf"), str(temp_dir / "Documents" / "file.pdf"))
    
    assert undo_last(temp_dir, hist_file, confirm=False)  # success
    assert (temp_dir / "file.pdf").exists()
    assert not (temp_dir / "Documents" / "file.pdf").exists()

