from fastapi import (
    FastAPI,
    HTTPException
)

from fastapi.middleware.cors import (
    CORSMiddleware
)

from kafka import KafkaProducer
from kafka.errors import NoBrokersAvailable
from psycopg2 import pool as pg_pool
from contextlib import contextmanager

import redis
import json
import time

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000"
    ],
    allow_methods=["*"],
    allow_headers=["*"]
)

producer  = None
_db_pool: pg_pool.ThreadedConnectionPool = None

redis_client = redis.Redis(
    host='redis',
    port=6379,
    decode_responses=True
)

_DB_KWARGS = dict(
    host='postgres',
    database='registration',
    user='admin',
    password='secret'
)


@contextmanager
def _get_db_conn():
    """Borrow a connection from the pool and return it automatically."""
    conn = _db_pool.getconn()
    try:
        yield conn
    finally:
        _db_pool.putconn(conn)


def seed_redis_from_postgres() -> int:
    """Load course quotas and metrics from Postgres into Redis.

    Returns the number of courses seeded, or 0 on failure.
    Called automatically on startup when Redis is empty, and as a
    fallback inside /register when a quota key is unexpectedly missing.
    """
    retries = 10
    for attempt in range(retries):
        try:
            with _get_db_conn() as conn:
                cur = conn.cursor()

                cur.execute("SELECT course_id, remaining FROM course_quota")
                courses = cur.fetchall()

                if not courses:
                    cur.close()
                    print("Warning: course_quota table is empty – nothing to seed")
                    return 0

                pipe = redis_client.pipeline()
                for course_id, remaining in courses:
                    pipe.set(f"quota:{course_id}", remaining)
                pipe.execute()

                print(f"Redis empty -> seeding courses...")
                for course_id, remaining in courses:
                    print(f"  [SEED] quota:{course_id} = {remaining}")
                print(f"Loaded {len(courses)} courses into Redis")

                # Restore metrics counters so the admin dashboard stays accurate.
                cur.execute(
                    """
                    SELECT
                        COUNT(*)                                     AS total,
                        COUNT(*) FILTER (WHERE status = 'success')  AS successful,
                        COUNT(*) FILTER (WHERE status = 'failed')   AS failed
                    FROM registration_events
                    """
                )
                total, successful, failed = cur.fetchone()
                redis_client.mset({
                    "metrics:total":      total,
                    "metrics:successful": successful,
                    "metrics:failed":     failed,
                })
                print(
                    f"  [SEED] metrics restored:"
                    f" total={total} successful={successful} failed={failed}"
                )

                cur.close()
                return len(courses)

        except Exception as e:
            print(
                f"[SEED] Postgres not ready yet ({attempt + 1}/{retries}): {e}"
            )
            time.sleep(3)

    print("[SEED] Warning: could not seed Redis from Postgres after all retries")
    return 0


@app.on_event("startup")
def startup_event():
    global producer, _db_pool

    # 1. Initialize DB connection pool (waits for Postgres to be ready)
    for i in range(30):
        try:
            _db_pool = pg_pool.ThreadedConnectionPool(
                minconn=2,
                maxconn=3,   # 8 workers × 3 = 24 total connections max
                **_DB_KWARGS
            )
            print("DB connection pool initialized (min=2 max=5)")
            break
        except Exception as e:
            print(f"Waiting for Postgres... ({i+1}/30): {e}")
            time.sleep(2)

    if _db_pool is None:
        print("Warning: Could not initialize DB pool. Will retry on first request.")

    # 2. Connect to Kafka
    for i in range(30):
        try:
            producer = KafkaProducer(
                bootstrap_servers='kafka:9092',
                value_serializer=lambda v: json.dumps(v).encode()
            )
            print("Successfully connected to Kafka")
            break
        except NoBrokersAvailable:
            print(f"Waiting for Kafka to be ready... ({i+1}/30)")
            time.sleep(2)
        except Exception as e:
            print(f"Error connecting to Kafka: {e}")
            time.sleep(2)

    if not producer:
        print("Warning: Could not connect to Kafka on startup. Will retry on first request.")

    # 3. Auto-seed Redis if it's empty (e.g. after a container restart).
    existing = redis_client.keys("quota:*")
    if not existing:
        seed_redis_from_postgres()
    else:
        print(f"Redis already has {len(existing)} quota key(s) – skipping seed")


def _log_failed_event(student_id: str, course_id: str, reason: str):
    """Insert a failed registration event into registration_events."""
    try:
        with _get_db_conn() as conn:
            cur = conn.cursor()
            cur.execute(
                """
                INSERT INTO registration_events (student_id, course_id, status, reason)
                VALUES (%s, %s, 'failed', %s)
                """,
                (student_id, course_id, reason)
            )
            conn.commit()
            cur.close()
    except Exception as e:
        print(f"Warning: could not log failed event: {e}")


@app.post("/register")
async def register(
    student_id: str,
    course_id: str
):
    # Check that the course exists before touching quota.
    # If the key is missing, Redis may have been flushed/restarted; attempt
    # a one-time reseed from Postgres before giving up with 404.
    if redis_client.get(f"quota:{course_id}") is None:
        print(
            f"[REGISTER] quota:{course_id} missing in Redis"
            f" – attempting reseed from Postgres"
        )
        seeded = seed_redis_from_postgres()
        if seeded == 0 or redis_client.get(f"quota:{course_id}") is None:
            _log_failed_event(student_id, course_id, "course_not_found")
            raise HTTPException(
                status_code=404,
                detail="Course not found"
            )

    # Atomically claim one slot.  If the result goes negative the course
    # was already full, so we restore the counter and reject immediately.
    remaining = redis_client.decr(f"quota:{course_id}")

    if remaining < 0:
        redis_client.incr(f"quota:{course_id}")
        _log_failed_event(student_id, course_id, "quota_full")
        raise HTTPException(
            status_code=400,
            detail="Course is full"
        )

    global producer
    if producer is None:
        try:
            producer = KafkaProducer(
                bootstrap_servers='kafka:9092',
                value_serializer=lambda v: json.dumps(v).encode()
            )
        except Exception as e:
            # Could not reach Kafka – give the slot back so it isn't lost.
            redis_client.incr(f"quota:{course_id}")
            _log_failed_event(student_id, course_id, "kafka_unavailable")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to connect to Kafka: {e}"
            )

    producer.send(
        "registrations",
        value={
            "student_id": student_id,
            "course_id": course_id
        }
    )

    return {
        "status": "queued",
        "message": "Yêu cầu đã được ghi nhận"
    }


@app.get("/check/{student_id}/{course_id}")
async def check_registration(
    student_id: str,
    course_id: str
):
    with _get_db_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT EXISTS(
                SELECT 1
                FROM registrations
                WHERE student_id=%s
                AND course_id=%s
            )
            """,
            (student_id, course_id)
        )
        exists = cur.fetchone()[0]
        cur.close()

    return {"registered": exists}


@app.get("/events")
async def get_events(limit: int = 20):
    with _get_db_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT student_id, course_id, status, reason, created_at
            FROM registration_events
            ORDER BY created_at DESC
            LIMIT %s
            """,
            (limit,)
        )
        rows = cur.fetchall()
        cur.close()

    return [
        {
            "id": i,
            "studentId": row[0],
            "courseId": row[1],
            "status": row[2],
            "reason": row[3],
            "timestamp": row[4].isoformat()
        }
        for i, row in enumerate(rows)
    ]


@app.get("/metrics")
async def get_metrics():
    with _get_db_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT
                COUNT(*)                                      AS total,
                COUNT(*) FILTER (WHERE status = 'success')   AS successful,
                COUNT(*) FILTER (WHERE status = 'failed')    AS failed
            FROM registration_events
            """
        )
        row = cur.fetchone()
        total, successful, failed = row[0], row[1], row[2]
        cur.close()

    courses = await get_courses()
    total_quota_left = sum(c["remaining"] for c in courses)

    return {
        "totalRequests": total,
        "successful": successful,
        "failed": failed,
        "totalQuotaLeft": total_quota_left
    }


@app.get("/courses")
async def get_courses():
    with _get_db_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT
                course_id,
                total_quota,
                remaining
            FROM course_quota
            """
        )
        rows = cur.fetchall()
        cur.close()

    courses = []

    for row in rows:
        remaining = redis_client.get(
            f"quota:{row[0]}"
        )

        raw = int(remaining) if remaining is not None else row[2]
        safe_remaining = max(0, min(raw, row[1]))  # clamp to [0, total_quota]

        courses.append({
            "course_id": row[0],
            "total_quota": row[1],
            "remaining": safe_remaining
        })

    return courses
