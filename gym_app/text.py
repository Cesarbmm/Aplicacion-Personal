from __future__ import annotations

from typing import Any


def sanitize_text(value: Any) -> str:
    text = "" if value is None else str(value)
    if any(token in text for token in ("Ãƒ", "Ã‚", "Ã¢", "ï¿½")):
        for source_encoding in ("latin-1", "cp1252"):
            try:
                fixed = text.encode(source_encoding).decode("utf-8")
                if fixed:
                    return fixed
            except Exception:
                continue
    return text


def sanitize_text(value: Any) -> str:
    text = "" if value is None else str(value)
    if any(token in text for token in ("Ã", "Â", "â", "�", "ÃƒÆ’", "Ãƒâ€š", "ÃƒÂ¢", "Ã¯Â¿Â½")):
        for source_encoding in ("latin-1", "cp1252"):
            try:
                fixed = text.encode(source_encoding).decode("utf-8")
                if fixed:
                    return fixed
            except Exception:
                continue
    return text


def sanitize_list(values: list[str]) -> list[str]:
    cleaned: list[str] = []
    for value in values:
        item = sanitize_text(value).strip()
        if item and item not in cleaned:
            cleaned.append(item)
    return cleaned
