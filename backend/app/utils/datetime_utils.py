from datetime import datetime, timezone

def utc_now():
    """Returns timezone-aware UTC datetime."""
    return datetime.now(timezone.utc)
