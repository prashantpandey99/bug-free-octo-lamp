import os
import time
import threading
import secrets
from collections import defaultdict, deque
from typing import Optional, Dict
import redis.asyncio as redis

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# In-memory sliding window fallback store
_memory_lock = threading.Lock()
_memory_windows: Dict[str, deque] = defaultdict(deque)
_memory_cooldowns: Dict[str, float] = {}

# Global Redis connection holder
_redis_pool: Optional[redis.Redis] = None
_redis_available: Optional[bool] = None


async def get_redis_client() -> Optional[redis.Redis]:
    """
    Attempts to initialize or return an existing Redis connection pool.
    Caches availability status to avoid repeated connection timeout penalties.
    """
    global _redis_pool, _redis_available
    if _redis_available is False:
        return None

    if _redis_pool is None:
        try:
            client = redis.from_url(
                REDIS_URL,
                decode_responses=True,
                socket_connect_timeout=1.0,
                socket_timeout=1.0
            )
            # Health check ping
            await client.ping()
            _redis_pool = client
            _redis_available = True
        except Exception:
            _redis_available = False
            _redis_pool = None
            return None

    return _redis_pool


class SecurityRateLimiter:
    """
    Dual-mode sliding window rate limiter.
    Uses Redis Sorted Sets (ZSET) when active, falling back to a thread-safe
    in-memory sliding window structure.
    """

    @classmethod
    async def check_sliding_window(
        cls,
        prefix: str,
        identifier: str,
        limit: int,
        window_seconds: int
    ) -> bool:
        """
        Enforces sliding-window rate limiting.
        Returns True if request is within limits, False if rate limited.
        """
        clean_id = identifier.lower().strip()
        r = await get_redis_client()

        if r is not None:
            bucket_key = f"ratelimit:{prefix}:{clean_id}"
            now = time.time()
            clear_before = now - window_seconds

            try:
                pipe = r.pipeline()
                pipe.zremrangebyscore(bucket_key, 0, clear_before)
                pipe.zcard(bucket_key)
                pipe.zadd(bucket_key, {f"{now}:{secrets.token_hex(4)}": now})
                pipe.expire(bucket_key, window_seconds)
                results = await pipe.execute()

                request_count = results[1]
                return request_count < limit
            except Exception:
                # If Redis connection drops during operation, smoothly fall back to in-memory
                pass

        # In-Memory Fallback
        now = time.time()
        bucket_key = f"{prefix}:{clean_id}"
        cutoff = now - window_seconds

        with _memory_lock:
            window = _memory_windows[bucket_key]
            # Prune expired entries
            while window and window[0] <= cutoff:
                window.popleft()

            if len(window) >= limit:
                return False

            window.append(now)
            return True

    @classmethod
    async def check_and_set_cooldown(cls, email: str, cooldown_seconds: int = 60) -> bool:
        """
        Enforces a cooldown between requests for the same email.
        Returns True if cooldown is active (blocked), False if allowed and sets new cooldown.
        """
        clean_email = email.lower().strip()
        r = await get_redis_client()

        if r is not None:
            cooldown_key = f"cooldown:otp:{clean_email}"
            try:
                exists = await r.exists(cooldown_key)
                if exists:
                    return True
                await r.set(cooldown_key, "1", ex=cooldown_seconds)
                return False
            except Exception:
                pass

        # In-Memory Fallback
        now = time.time()
        with _memory_lock:
            expiry = _memory_cooldowns.get(clean_email, 0)
            if now < expiry:
                return True
            _memory_cooldowns[clean_email] = now + cooldown_seconds
            return False

    @classmethod
    async def is_email_throttled(cls, email: str) -> bool:
        """Limit: Maximum 3 requests per 15 minutes (900s) per email address."""
        return not await cls.check_sliding_window("email_otp", email, limit=3, window_seconds=900)

    @classmethod
    async def is_ip_throttled(cls, ip_address: str) -> bool:
        """Limit: Maximum 10 requests per 15 minutes (900s) per IP address."""
        return not await cls.check_sliding_window("ip_otp", ip_address, limit=10, window_seconds=900)

    @classmethod
    def reset_for_testing(cls):
        """Clears in-memory test states for automated testing suites."""
        with _memory_lock:
            _memory_windows.clear()
            _memory_cooldowns.clear()
