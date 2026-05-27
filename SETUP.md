# Hướng Dẫn Cài Đặt & Chạy Hệ Thống

> Tài liệu này hướng dẫn từng bước để khởi chạy toàn bộ hệ thống **Đăng ký Học phần chịu tải cao** trên máy cục bộ bằng Docker.

---

## Bước 1 — Chuẩn Bị Môi Trường

Đảm bảo Docker và Docker Compose đã được cài đặt và đang chạy:

```bash
docker --version
# Docker version 24.x.x hoặc mới hơn

docker compose version
# Docker Compose version v2.x.x
```

> **Lưu ý:** Docker Compose v2 được tích hợp sẵn trong Docker Desktop (Windows/macOS). Nếu dùng Linux, cài thêm plugin `docker-compose-plugin` hoặc sử dụng lệnh `docker-compose` (v1) thay cho `docker compose`.

**RAM khuyến nghị:** ≥ 6 GB — Spark, Kafka và Redis chạy đồng thời tiêu tốn khá nhiều bộ nhớ.

---

## Bước 2 — Chuẩn Bị Mã Nguồn

Clone hoặc giải nén dự án về máy. Cấu trúc thư mục tối thiểu cần có:

```
Bigdata_Project/
├── api/
│   ├── Dockerfile
│   ├── main.py
│   └── requirements.txt
├── spark/
│   ├── Dockerfile
│   ├── job.py
│   ├── init_redis.py
│   └── requirements.txt
├── frontend/
│   ├── Dockerfile
│   └── src/
├── load_test/
│   └── simulate.py
├── init-db.sql
└── docker-compose.yml
```

Di chuyển vào thư mục gốc của dự án:

```bash
cd Bigdata_Project
```

---

## Bước 3 — Khởi Động Toàn Bộ Hệ Thống

```bash
docker compose up --build -d
```

Lệnh này sẽ build image và khởi động **7 service** theo thứ tự phụ thuộc:


| Service     | Vai trò                           | Port       |
| ----------- | --------------------------------- | ---------- |
| `zookeeper` | Điều phối cluster Kafka           | *(nội bộ)* |
| `kafka`     | Message broker nhận event đăng ký | `9092`     |
| `redis`     | Atomic counter lưu quota môn học  | `6379`     |
| `postgres`  | Cơ sở dữ liệu bền vững            | `5432`     |
| `api`       | FastAPI backend                   | `8000`     |
| `spark`     | Spark Streaming job xử lý nền     | *(nội bộ)* |
| `frontend`  | Giao diện React                   | `3000`     |


Theo dõi tiến trình khởi động:

```bash
docker compose logs -f
```

Chờ đến khi thấy log từ `api` tương tự:

```
api-1  | Successfully connected to Kafka
api-1  | INFO:     Application startup complete.
```

Kiểm tra nhanh tất cả service đang chạy:

```bash
docker compose ps
```

---

## Bước 4 — Đồng Bộ Quota Từ PostgreSQL Vào Redis

> **Tại sao cần bước này?**
>
> `init-db.sql` tạo bảng `course_quota` trong PostgreSQL (nguồn dữ liệu gốc), nhưng FastAPI và Spark lại đọc/ghi quota thông qua **Redis** (in-memory, tốc độ cao). Script `init_redis.py` đọc giá trị `remaining` từ PostgreSQL và đặt vào Redis với key dạng `quota:CS101`, `quota:CS102`. Nếu bỏ qua bước này, mọi request đăng ký sẽ bị từ chối do Redis không tìm thấy key quota.

Chạy script bên trong container `spark`:

```bash
docker compose exec spark python3 /opt/spark/init_redis.py
```

Xác minh Redis đã có dữ liệu (tuỳ chọn):

```bash
docker compose exec redis redis-cli GET quota:CS101
# Kết quả mong đợi: số quota tương ứng đã cấu hình trong init-db.sql

docker compose exec redis redis-cli GET quota:CS102
# Kết quả mong đợi: số quota tương ứng đã cấu hình trong init-db.sql
```

---

## Bước 5 — Truy Cập Giao Diện

Mở trình duyệt và truy cập:


| Địa chỉ                                                      | Mô tả                                             |
| ------------------------------------------------------------ | ------------------------------------------------- |
| **[http://localhost:3000](http://localhost:3000)**           | Giao diện chính (chọn vai trò Sinh viên / Admin)  |
| **[http://localhost:8000/docs](http://localhost:8000/docs)** | Swagger UI — tài liệu và thử nghiệm API trực tiếp |


Trên giao diện sinh viên, bạn có thể:

- Xem danh sách môn học cùng số chỗ còn lại
- Nhập mã sinh viên và đăng ký môn học
- Kiểm tra trạng thái đăng ký

---

## Bước 6 — (Tuỳ Chọn) Kiểm Thử Chịu Tải

Script `load_test/simulate.py` giả lập nhiều sinh viên tranh nhau đăng ký cùng lúc. Script kết nối trực tiếp đến `http://localhost:8000` nên cần chạy trên **máy host**.

### Yêu cầu

```bash
# Kiểm tra Python trên máy host
python --version   # hoặc python3 --version

# Cài thư viện cần thiết
pip install requests
```

### Chạy load test

```bash
cd load_test
python simulate.py
```

Hoặc từ thư mục gốc:

```bash
python load_test/simulate.py
```

### Kết quả mong đợi

```
Total: <NUM_REQUESTS>, accepted: <số request được API nhận>
```

> `NUM_REQUESTS` và `CONCURRENCY` được cấu hình trực tiếp trong `load_test/simulate.py`. Sau khi test xong, kiểm tra DB ở Bước 7 để xác nhận tính đúng đắn.

---

## Bước 7 — Kiểm Tra Kết Quả Trong Database

Chạy trực tiếp từ terminal mà không cần vào psql:

### Kiểm tra tổng số đăng ký thành công theo từng môn

```bash
docker compose exec postgres psql -U admin -d registration -c \
  "SELECT course_id, COUNT(*) AS total_registered FROM registrations GROUP BY course_id ORDER BY course_id;"
```

Kết quả đúng: `total_registered` của mỗi môn ≤ `total_quota` đã cấu hình trong `init-db.sql`.

### Kiểm tra không có đăng ký trùng

```bash
docker compose exec postgres psql -U admin -d registration -c \
  "SELECT student_id, course_id, COUNT(*) AS cnt FROM registrations GROUP BY student_id, course_id HAVING COUNT(*) > 1;"
```

Kết quả đúng: **không có hàng nào trả về** — mỗi cặp `(student_id, course_id)` là duy nhất.

### Kiểm tra quota còn lại so với số đã đăng ký

```bash
docker compose exec postgres psql -U admin -d registration -c \
  "SELECT q.course_id, q.total_quota, COUNT(r.id) AS registered, q.total_quota - COUNT(r.id) AS remaining_calc FROM course_quota q LEFT JOIN registrations r ON q.course_id = r.course_id GROUP BY q.course_id, q.total_quota ORDER BY q.course_id;"
```

---

## Bước 8 — Xem Log Spark

Xem log của Spark Streaming để theo dõi quá trình tiêu thụ Kafka và ghi PostgreSQL:

```bash
# Theo dõi log theo thời gian thực
docker compose logs -f spark
```

Bạn sẽ thấy các dòng log tương tự:

```
spark-1  | Successfully connected to Kafka topic 'registrations'
spark-1  | Batch 0: processing 42 records
spark-1  | Batch 1: processing 118 records
...
```

Xem log của service API:

```bash
docker compose logs -f api
```

Xem log tất cả service cùng lúc (có prefix tên service):

```bash
docker compose logs -f --tail=50
```

Dừng theo dõi log: `Ctrl + C`

---

## Reset Dữ Liệu Để Chạy Lại Test

Sau khi chạy load test, toàn bộ quota sẽ về 0. Thực hiện **đủ 3 bước** sau để reset sạch và chạy lại:

### Bước 1 — Reset quota và xóa dữ liệu cũ trong PostgreSQL

```bash
docker compose exec postgres psql -U admin -d registration -c "
UPDATE course_quota SET remaining = total_quota;
TRUNCATE registration_events;
TRUNCATE registrations;
"
```

Lệnh này:
- Khôi phục `remaining` về đúng giá trị `total_quota` ban đầu cho từng môn
- Xóa toàn bộ lịch sử event và đăng ký cũ

### Bước 2 — Đồng bộ lại quota từ PostgreSQL vào Redis

```bash
docker compose exec spark python3 /opt/spark/init_redis.py
```

Sau bước này, `quota:CS101 … quota:CS111` và các metrics counter trong Redis sẽ được khôi phục, hệ thống sẵn sàng nhận request mới.

> **Lưu ý:** Không cần restart container, hệ thống tiếp tục chạy bình thường sau khi reset.

---

## Dừng Hệ Thống

Dừng tất cả container nhưng **giữ lại dữ liệu** (volume PostgreSQL):

```bash
docker compose down
```

Dừng và **xoá toàn bộ dữ liệu** (reset về trạng thái ban đầu):

```bash
docker compose down -v
```

> Sau khi chạy `docker compose down -v` rồi khởi động lại, cần chạy lại **Bước 4** (init Redis) vì dữ liệu PostgreSQL và Redis đã bị xoá.

---

## Tóm Tắt Nhanh

```bash
# 1. Khởi động
docker compose up --build -d

# 2. Đồng bộ quota vào Redis (chỉ chạy 1 lần sau khi postgres sẵn sàng)
docker compose exec spark python3 /opt/spark/init_redis.py

# 3. Mở trình duyệt
#    http://localhost:3000       ← Giao diện
#    http://localhost:8000/docs  ← API Docs

# 4. (Tuỳ chọn) Load test
python load_test/simulate.py

# 5. Dừng hệ thống
docker compose down
```

---

*Xem thêm kiến trúc chi tiết tại [ARCHITECTURE.md](./ARCHITECTURE.md)*