from fastapi import (
    FastAPI,
    HTTPException
)

from fastapi.middleware.cors import (
    CORSMiddleware
)

from kafka import KafkaProducer

import redis
import psycopg2
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000"
    ],
    allow_methods=["*"],
    allow_headers=["*"]
)

producer = KafkaProducer(
    bootstrap_servers='kafka:9092',
    value_serializer=lambda v:
        json.dumps(v).encode()
)

redis_client = redis.Redis(
    host='redis',
    port=6379,
    decode_responses=True
)

@app.post("/register")
async def register(
    student_id: str,
    course_id: str
):
    quota = redis_client.get(
        f"quota:{course_id}"
    )

    if quota is None:
        raise HTTPException(
            status_code=404,
            detail="Course not found"
        )

    if int(quota) <= 0:
        raise HTTPException(
            status_code=400,
            detail="Course is full"
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
        "message":
            "Yêu cầu đã được ghi nhận"
    }

@app.get(
    "/check/{student_id}/{course_id}"
)
async def check_registration(
    student_id: str,
    course_id: str
):
    conn = psycopg2.connect(
        host='postgres',
        database='registration',
        user='admin',
        password='secret'
    )

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

    return {
        "registered": exists
    }

@app.get("/courses")
async def get_courses():
    conn = psycopg2.connect(
        host='postgres',
        database='registration',
        user='admin',
        password='secret'
    )

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

        courses.append({
            "course_id": row[0],
            "total_quota": row[1],
            "remaining":
                int(remaining)
                if remaining is not None
                else row[2]
        })

    cur.close()
    conn.close()

    return courses
