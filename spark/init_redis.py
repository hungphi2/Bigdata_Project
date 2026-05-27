import redis
import psycopg2

conn = psycopg2.connect(
    host='postgres',
    database='registration',
    user='admin',
    password='secret'
)

cur = conn.cursor()

r = redis.Redis(
    host='redis',
    port=6379,
    decode_responses=True
)

# Restore quota counters from DB.
# course_quota.remaining is kept in sync by Spark after every batch,
# so these values are always up to date.
cur.execute(
    """
    SELECT course_id, remaining
    FROM course_quota
    """
)
for course_id, remaining in cur.fetchall():
    r.set(f"quota:{course_id}", remaining)
    print(f"[INIT] quota:{course_id} = {remaining}")

# Restore metrics counters from DB so dashboards stay accurate
# across container restarts.
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
r.set("metrics:total",      total)
r.set("metrics:successful", successful)
r.set("metrics:failed",     failed)
print(
    f"[INIT] metrics restored:"
    f" total={total} successful={successful} failed={failed}"
)

cur.close()
conn.close()
