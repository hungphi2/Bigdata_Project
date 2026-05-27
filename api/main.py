from fastapi import (
    FastAPI,
    HTTPException
)

from fastapi.middleware.cors import (
    CORSMiddleware
)

from kafka import KafkaProducer
from kafka.errors import NoBrokersAvailable

import redis
import psycopg2
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

producer = None


@app.on_event("startup")
def startup_event():
    global producer
    retries = 30
    for i in range(retries):
        try:
            producer = KafkaProducer(
                bootstrap_servers='kafka:9092',
                value_serializer=lambda v: json.dumps(v).encode()
            )
            print("Successfully connected to Kafka")
            break
        except NoBrokersAvailable:
            print(f"Waiting for Kafka to be ready... ({i+1}/{retries})")
            time.sleep(2)
        except Exception as e:
            print(f"Error connecting to Kafka: {e}")
            time.sleep(2)

    if not producer:
        print("Warning: Could not connect to Kafka on startup. Will retry on first request.")


redis_client = redis.Redis(
    host='redis',
    port=6379,
    decode_responses=True
)


def _get_db_conn():
    return psycopg2.connect(
        host='postgres',
        database='registration',
        user='admin',
        password='secret'
    )


def _log_failed_event(student_id: str, course_id: str, reason: str):
    """Insert a failed registration event into registration_events."""
    try:
        conn = _get_db_conn()
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
        conn.close()
    except Exception as e:
        print(f"Warning: could not log failed event: {e}")


@app.post("/register")
async def register(
    student_id: str,
    course_id: str
):
    # Check that the course exists before touching quota.
    if redis_client.get(f"quota:{course_id}") is None:
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
    conn = _get_db_conn()
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
    conn.close()

    return {"registered": exists}


@app.get("/events")
async def get_events(limit: int = 20):
    conn = _get_db_conn()
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
    conn.close()

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
    conn = _get_db_conn()
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
    conn.close()

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
    conn = _get_db_conn()
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

    cur.close()
    conn.close()

    return courses
