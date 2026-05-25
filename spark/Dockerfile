FROM apache/spark-py:v3.4.0

USER root

COPY requirements.txt .

RUN pip3 install \
    --no-cache-dir \
    -r requirements.txt

COPY job.py /opt/spark/job.py
COPY init_redis.py /opt/spark/init_redis.py

CMD ["/opt/spark/bin/spark-submit", "--packages", "org.apache.spark:spark-sql-kafka-0-10_2.12:3.4.0", "/opt/spark/job.py"]
