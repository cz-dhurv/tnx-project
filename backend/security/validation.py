"""
Input validation and security utilities.
File type validation, size limits, input sanitization, path traversal prevention.
"""

import hashlib
import re
import os
from pathlib import Path

from observability.logger import get_logger

logger = get_logger(__name__)

# Allowed MIME types for document upload
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "text/plain",
    "text/markdown",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",  # .docx
}

# Allowed file extensions
ALLOWED_EXTENSIONS = {".pdf", ".txt", ".md", ".docx"}


def validate_file(
    filename: str,
    content_type: str | None,
    file_size: int,
    max_size_bytes: int,
) -> tuple[bool, str]:
    """
    Validate an uploaded file. Returns (is_valid, error_message).
    Checks extension, MIME type, and size.
    """
    # Check filename for path traversal
    if ".." in filename or "/" in filename or "\\" in filename:
        return False, "Invalid filename — path traversal detected."

    # Check extension
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        return False, f"Unsupported file type '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"

    # Check MIME type (if provided)
    if content_type and content_type not in ALLOWED_MIME_TYPES:
        # Be lenient — some browsers send odd MIME types for .md files
        if ext not in {".md", ".txt"}:
            return False, f"Unsupported MIME type '{content_type}'."

    # Check size
    if file_size > max_size_bytes:
        max_mb = max_size_bytes / (1024 * 1024)
        return False, f"File too large ({file_size / (1024*1024):.1f}MB). Maximum: {max_mb:.0f}MB."

    if file_size == 0:
        return False, "File is empty."

    return True, ""


def sanitize_filename(filename: str) -> str:
    """Remove dangerous characters from filename, preserve extension."""
    # Get base and extension
    name = Path(filename).stem
    ext = Path(filename).suffix.lower()

    # Remove non-alphanumeric except hyphens and underscores
    name = re.sub(r"[^\w\-]", "_", name)
    # Collapse multiple underscores
    name = re.sub(r"_+", "_", name).strip("_")

    if not name:
        name = "document"

    return f"{name}{ext}"


def compute_checksum(data: bytes) -> str:
    """Compute SHA-256 checksum of file data."""
    return hashlib.sha256(data).hexdigest()


def sanitize_user_input(text: str) -> str:
    """
    Basic sanitization for user chat input.
    Strips control characters but preserves normal text.
    """
    # Remove null bytes and other control characters (keep newlines, tabs)
    sanitized = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)
    return sanitized.strip()
