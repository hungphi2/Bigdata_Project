from pyspark.sql import SparkSession
from pyspark.sql.functions import (
    from_json,
    col
)
from pyspark.sql.types import (
    StructType,
    StringType
)

import redis
import psycopg2
import traceback
import time

spark = (
    SparkSession.builder
    .appName("RegistrationProcessor")
    .getOrCreate()
)

schema = (
    StructType()
    .add("student_id", StringType())
    .add("course_id", StringType())
)

df = None
while True:
    try:
        df = (
            spark.readStream
            .format("kafka")
            .option("kafka.bootstrap.servers", "kafka:9092")
            .option("subscribe", "registrations")
            # Read from earliest offset when no checkpoint exists,
            # so messages queued before Spark starts are never skipped.
            .option("startingOffsets", "earliest")
            .load()
        )
        print("[CONSUMER] Successfully connected to Kafka topic 'registrations'")
        break
    except Exception as e:
        print(
            f"[CONSUMER] Waiting for Kafka topic 'registrations'..."
            f" {e}"
        )
        time.sleep(5)

parsed = (
    df.select(
        from_json(
            col("value").cast("string"),
            schema
        ).alias("data")
    )
    .select("data.*")
)


def _log_event(conn, student_id, course_id, status, reason):
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO registration_events (student_id, course_id, status, reason)
        VALUES (%s, %s, %s, %s)
        """,
        (student_id, course_id, status, reason)
    )
    conn.commit()
    cur.close()


def process_batch(batch_df, batch_id):
    count = batch_df.count()
    if count == 0:
        return

    print(f"[CONSUMER] batch {batch_id}: processing {count} rows")

    r = redis.Redis(
        host='redis',
        port=6379,
        decode_responses=True
    )
    conn = psycopg2.connect(
        host='postgres',
        database='registration',
        user='admin',
        password='secret'
    )

    batch_ok = 0
    batch_fail = 0
    courses_in_batch = set()

    for row in batch_df.collect():
        student = row['student_id']
        course  = row['course_id']
        courses_in_batch.add(course)

        print(
            f"[CONSUMER] received registration"
            f" student={student} course={course}"
        )

        try:
            # Quota was already decremented atomically at the API layer.
            # Spark only needs to verify the slot is still valid and
            # handle the rare duplicate case.
            try:
                cur = conn.cursor()
                cur.execute(
                    """
                    INSERT INTO registrations (student_id, course_id)
                    VALUES (%s, %s)
                    """,
                    (student, course)
                )
                conn.commit()
                cur.close()

                _log_event(conn, student, course, "success", None)

                total = r.incr("metrics:total")
                succ  = r.incr("metrics:successful")
                print(
                    f"[CONSUMER] metrics incremented"
                    f" successful={succ} total={total}"
                )
                print(
                    f"[CONSUMER] event stored"
                    f" student={student} course={course} status=success"
                )
                batch_ok += 1

            except psycopg2.IntegrityError:
                # Duplicate registration: return the quota slot to Redis.
                conn.rollback()
                r.incr(f"quota:{course}")
                _log_event(
                    conn, student, course, "failed", "duplicate"
                )
                total = r.incr("metrics:total")
                fail  = r.incr("metrics:failed")
                batch_fail += 1
                print(
                    f"[CONSUMER] duplicate rejected"
                    f" student={student} course={course}"
                    f" failed={fail} total={total}"
                )

        except Exception as e:
            print(
                f"[CONSUMER] ERROR processing"
                f" student={student} course={course}: {e}"
            )
            traceback.print_exc()
            try:
                conn.rollback()
            except Exception:
                pass

    # Sync Redis quota values back to PostgreSQL for the courses touched
    # in this batch so that course_quota.remaining stays consistent with
    # Redis. This prevents init_redis.py from restoring stale values on
    # the next container restart.
    if courses_in_batch:
        try:
            cur = conn.cursor()
            for cid in courses_in_batch:
                val = r.get(f"quota:{cid}")
                if val is not None:
                    cur.execute(
                        """
                        UPDATE course_quota
                        SET remaining = %s
                        WHERE course_id = %s
                        """,
                        (int(val), cid)
                    )
            conn.commit()
            cur.close()
            print(
                f"[CONSUMER] DB quota synced for courses:"
                f" {courses_in_batch}"
            )
        except Exception as e:
            print(f"[CONSUMER] WARNING: DB quota sync failed: {e}")
            traceback.print_exc()

    conn.close()
    print(
        f"[CONSUMER] batch {batch_id} commit completed:"
        f" successful={batch_ok} failed={batch_fail}"
    )


while True:
    try:
        query = (
            parsed.writeStream
            .foreachBatch(process_batch)
            .outputMode("append")
            # Stable checkpoint path so restarts resume from last offset
            # rather than starting a brand-new query each time.
            .option(
                "checkpointLocation",
                "/tmp/checkpoint/registration_job"
            )
            .start()
        )
        query.awaitTermination()
    except Exception as e:
        print(
            f"[CONSUMER] Streaming query failed: {e}."
            f" Restarting in 5 seconds..."
        )
        traceback.print_exc()
        time.sleep(5)
