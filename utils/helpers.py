import hashlib
from pathlib import Path



def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)



def file_sha1(path: Path, chunk_size: int = 8192) -> str:
    digest = hashlib.sha1()
    with path.open("rb") as f:
        while True:
            chunk = f.read(chunk_size)
            if not chunk:
                break
            digest.update(chunk)
    return digest.hexdigest()



def safe_stem(filename: str) -> str:
    stem = Path(filename).stem.strip().replace(" ", "_")
    return "".join(ch for ch in stem if ch.isalnum() or ch in {"_", "-"}) or "document"



def save_uploaded_pdf(file_bytes: bytes, target_dir: Path, original_name: str) -> Path:
    ensure_dir(target_dir)
    safe_name = safe_stem(original_name)
    sha = hashlib.sha1(file_bytes).hexdigest()[:10]
    out_path = target_dir / f"{safe_name}_{sha}.pdf"
    out_path.write_bytes(file_bytes)
    return out_path
