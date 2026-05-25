# Hướng Dẫn Chạy & Kiểm Thử Hệ Thống (High-Concurrency Registration)

## Bước 1: Khởi động toàn bộ hệ thống
Sử dụng Docker Compose để build và chạy tất cả các dịch vụ (API, Frontend, Spark, Kafka, Zookeeper, Redis, Postgres):
```bash
docker compose up --build -d
```
*(Đợi khoảng 15-30 giây để tất cả các container, đặc biệt là Kafka và Spark, boot lên hoàn toàn).*

## Bước 2: Khởi tạo dữ liệu Redis (Set quota cho khóa học)
Chạy script khởi tạo Redis đã được copy sẵn vào bên trong container `spark` để set số lượng slot giả lập:
```bash
docker compose exec spark python3 /opt/spark/init_redis.py
```
*(Script này sẽ setup các key như `course:CS101:quota` với số lượng giới hạn nhằm chặn overbooking).*

## Bước 3: Truy cập các giao diện kiểm tra
- **Frontend (React)**: Truy cập http://localhost:3000
- **FastAPI Document (Swagger UI)**: Truy cập http://localhost:8000/docs
- Có thể dùng Swagger UI để test thủ công 1 request đăng ký trước khi load test.

## Bước 4: Chạy Load Test (Mô phỏng 5000 request)
Ở môi trường máy host (máy ngoài), đảm bảo bạn đã cài module `requests`, sau đó chạy script giả lập:
```bash
pip install requests
python load_test/simulate.py
```
*(Script này dùng ThreadPoolExecutor để bắn 5000 requests đồng thời tới `/register`, mô phỏng hiện tượng race condition cạnh tranh tranh giành slot môn học).*

## Bước 5: Verify (Xác thực dữ liệu trong Database)
Sau khi load test chạy xong (hoặc đang chạy), vào container PostgreSQL kiểm tra kết quả ghi nhận cuối cùng để xác minh xem có bị lố số lượng (overbooking) hoặc trùng lặp (duplicates) không.

Kiểm tra số lượng đăng ký thực tế của từng môn:
```bash
docker compose exec postgres psql -U admin -d registration -c "SELECT course_id, COUNT(1) FROM registrations GROUP BY course_id;"
```

Xem chi tiết 10 đăng ký gần nhất:
```bash
docker compose exec postgres psql -U admin -d registration -c "SELECT * FROM registrations ORDER BY registered_at DESC LIMIT 10;"
```

## 📌 Các Bước Demo Hệ Thống Khuyến Nghị:
1. **Show trạng thái rỗng:** Truy cập Frontend (http://localhost:3000) show các môn học đang trống người đăng ký.
2. **Khởi tạo Quota:** Chạy lệnh ở Bước 2 để thiết lập slot trong Redis.
3. **Show high throughput:** Mở terminal chạy `python load_test/simulate.py`. Màn hình sẽ hiện log spam tốc độ phản hồi rất nhanh từ FastAPI.
4. **Show real-time behavior:** Reload trang Frontend liên tục trong lúc test, chỉ ra rằng API FastAPI vẫn sống sót phản hồi tốt (không sập rớt) nhờ đẩy event vào Kafka.
5. **Show Consistency (Không Race condition):** Khi tiến trình load test ngừng, mở Postgres chạy lệnh kiểm tra Group By ở Bước 5. Đối chiếu tổng số `COUNT(*)` xem có hoàn toàn bị giới hạn đúng với số slot ban đầu không (VD set 50 slot thì count Max = 50, dù có 5000 requests đồng loạt gọi vào).
6. **Show Unique Constraint:** Thử gửi lại 1 request đăng ký với `student_id` và `course_id` đã thành công, chỉ ra việc cơ sở dữ liệu đã reject (bỏ qua) thành công duplicate record nhờ ràng buộc UNIQUE.
