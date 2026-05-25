FROM bitnami/spark:3.4.3

USER root

RUN apt-get update && \
    apt-get install -y python3-pip

COPY requirements.txt .

RUN pip3 install \
    --no-cache-dir \
    -r requirements.txt

COPY job.py \
/opt/bitnami/spark/job.py

COPY init_redis.py \
/opt/bitnami/spark/init_redis.py

CMD ["spark-submit", "--packages", "org.apache.spark:spark-sql-kafka-0-10_2.12:3.4.3", "/opt/bitnami/spark/job.py"]
