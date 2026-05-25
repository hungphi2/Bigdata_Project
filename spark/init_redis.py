import redis
import psycopg2

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
        remaining
    FROM course_quota
    """
)

r = redis.Redis(
    host='redis',
    port=6379,
    decode_responses=True
)

for course_id, remaining in cur.fetchall():
    r.set(
        f"quota:{course_id}",
        remaining
    )

cur.close()
conn.close()
