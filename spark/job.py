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
import time

spark = (
    SparkSession.builder
    .appName(
        "RegistrationProcessor"
    )
    .config(
        "spark.sql.streaming.checkpointLocation",
        "/tmp/checkpoint"
    )
    .getOrCreate()
)

schema = (
    StructType()
    .add(
        "student_id",
        StringType()
    )
    .add(
        "course_id",
        StringType()
    )
)

df = None
while True:
    try:
        df = (
            spark.readStream
            .format("kafka")
            .option("kafka.bootstrap.servers", "kafka:9092")
            .option("subscribe", "registrations")
            .load()
        )
        print("Successfully connected to Kafka topic 'registrations'")
        break
    except Exception as e:
        print(f"Waiting for Kafka topic 'registrations' to be available... {e}")
        time.sleep(5)

parsed = (
    df.select(
        from_json(
            col("value")
            .cast("string"),
            schema
        ).alias("data")
    )
    .select("data.*")
)

def process_batch(
    batch_df,
    batch_id
):
    if batch_df.count() == 0:
        return

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

    cur = conn.cursor()

    for row in batch_df.collect():
        student = row[
            'student_id'
        ]

        course = row[
            'course_id'
        ]

        remaining = r.decr(
            f"quota:{course}"
        )

        if remaining >= 0:
            try:
                cur.execute(
                    """
                    INSERT INTO registrations
                    (
                        student_id,
                        course_id
                    )
                    VALUES (%s, %s)
                    """,
                    (
                        student,
                        course
                    )
                )

                conn.commit()

            except psycopg2.IntegrityError:
                conn.rollback()

                r.incr(
                    f"quota:{course}"
                )

        else:
            r.incr(
                f"quota:{course}"
            )

    cur.close()
    conn.close()

while True:
    try:
        query = parsed.writeStream \
            .foreachBatch(
                process_batch
            ) \
            .outputMode(
                "append"
            ) \
            .start()
            
        query.awaitTermination()
    except Exception as e:
        print(f"Streaming query failed: {e}. Restarting in 5 seconds...")
        time.sleep(5)
