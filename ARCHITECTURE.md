# TÀI LIỆU KIẾN TRÚC & HOẠT ĐỘNG DỰ ÁN ĐĂNG KÝ HỌC PHẦN (BIG DATA)

## 1. Giới thiệu khái quát (Overview)
Hệ thống giải quyết vấn đề thường gặp ở các trường đại học: **nghẽn mạng và database bị quá tải khi hàng ngàn sinh viên truy cập đăng ký môn học cùng một lúc**. 

Thay vì ghi trực tiếp vào cơ sở dữ liệu (Database) truyền thống với mỗi yêu cầu đăng ký, hệ thống sử dụng kiến trúc **Event-Driven (Hướng sự kiện)** và **Streaming (Xử lý luồng)** kết hợp với **In-memory Cache** để dàn đều tải, phản hồi nhanh chóng cho người dùng và tránh tình trạng đăng ký vượt chỉ tiêu (overbooking).

## 2. Các thành phần công nghệ chính (Tech Stack)
Dự án được kết nối với nhau thông qua `docker-compose`, bao gồm các thành phần:

1. **Frontend (ReactJS - Port 3000):** Giao diện web hiển thị danh sách khóa học (CourseList), Form đăng ký (RegisterForm) và chức năng kiểm tra trạng thái đăng ký (StatusChecker).
2. **Backend API (FastAPI / Python - Port 8000):** Cổng giao tiếp, nhận request đăng ký của sinh viên.
3. **Message Broker (Apache Kafka & Zookeeper - Port 9092):** Đóng vai trò như một "phễu hứng" và hàng đợi. Khi API nhận yêu cầu, nó gửi dữ liệu vào Kafka thay vì ghi thẳng xuống DB. Việc này giúp API phản hồi cực nhanh mà không bị nghẽn (bottleneck).
4. **Cache / Distributed Counter (Redis - Port 6379):** Lưu trữ số lượng (quota) còn lại của mỗi khóa học trên bộ nhớ RAM. Giúp cho việc kiểm tra số lượng trống và thao tác "xí chỗ" diễn ra tức thời.
5. **Stream Processing (Apache Spark):** Hệ thống xử lý dữ liệu lớn (Spark Structured Streaming). Liên tục lấy các gói đăng ký đang nằm chờ trong Kafka ra để phân tích, đối soát với Redis và ghi dữ liệu về DB.
6. **Relational Database (PostgreSQL - Port 5432):** Nơi lưu trữ thông tin bền vững (Source of Truth). Chứa 2 bảng chính: 
   - `course_quota` (chứa ID khóa học, tổng số lượng, số lượng còn lại)
   - `registrations` (chứa sinh viên nào đã đăng ký khóa học nào).

## 3. Luồng xử lý chi tiết (Workflow)

### Bước 1: Khởi tạo hệ thống
- Khi bật Docker Compose, PostgreSQL sẽ chạy file `init-db.sql` để tạo ra khoá học mẫu (Ví dụ: `CS101` với 50 chỗ, `CS102` với 30 chỗ).
- Script `spark/init_redis.py` được khởi chạy, nó rút dữ liệu chỗ trống (`remaining`) từ PostgreSQL và đưa lên **Redis** để lưu đệm với key dạng `quota:CS101`, `quota:CS102`.

### Bước 2: Hiển thị và người dùng gửi yêu cầu đăng ký
- Khi sinh viên gửi một request đăng ký thông qua **Frontend** -> **Backend API** gọi endpoint `POST /register`.
- API dùng **Redis** để kiểm tra nhanh. Nếu `quota > 0`, nó sẽ gửi một sự kiện `{"student_id": "...", "course_id": "..."}` vào trong topic `registrations` của **Kafka** và lập tức trả kết quả cho người dùng: *"Yêu cầu đã được ghi nhận"*.

### Bước 3: Xử lý luồng nền (Background Processing) bởi Apache Spark
- App Spark (`spark/job.py`) liên tục nghe ngóng các dữ liệu đổ về từ Kafka (theo dạng batch stream).
- Với từng người đăng ký, Spark sẽ gọi lệnh `DECR` (trừ đi 1) trên **Redis** đối với quota của môn đó:
  - **Trường hợp hợp lệ (`remaining >= 0`):** Spark thực hiện ghi dữ liệu mới lưu xuống lịch sử trong **PostgreSQL** (`INSERT INTO registrations`). Nếu DB báo lỗi `IntegrityError` (báo rằng sv này đã đăng ký trùng/đã đăng ký môn này trước đó rồi), Spark sẽ tự động Rollback (hoàn trả) lại 1 slot lên cho Redis (`INCR`).
  - **Trường hợp hết chỗ (Redis cảnh báo `remaining < 0`):** Có thể request bị lọt qua khi đồng thời lượng vào quá lớn, Spark sẽ khôi phục trả lại `quota` lên Redis (bằng `INCR`) và không ghi xuống PostgreSQL. Cuộc đăng ký bị xem là thất bại (hết slot).

### Bước 4: Kiểm tra trạng thái 
- Frontend gọi API `GET /check/{student_id}/{course_id}`. Khi nhận được lệnh này, API sẽ truy vấn trực tiếp vào **PostgreSQL** (chứ không thông qua Kafka/Redis) để đảm bảo tính chính xác cuối cùng xem sinh viên đã thực sự có tên trong danh sách lớp hay chưa.

## 4. Kiểm thử chịu tải (Load Testing)
Dự án có module `load_test/simulate.py`. Module này viết theo dạng gọi giả lập:
- Tạo ra **5000 request đăng ký giả cùng lúc** (`NUM_REQUESTS = 5000`).
- Với mức số luồng truy cập đồng thời (`CONCURRENCY = 100`).
-> Bài test này nhằm xác thực tính nguyên vẹn của dòng chảy dữ liệu, chứng minh rằng dù cho hệ thống có nhận 5000 người vào tranh nhau đăng ký khóa `CS101` (chỉ có 50 chỗ), kiến trúc Kafka và Spark kết hợp Redis vẫn sẽ đảm bảo dữ liệu xử lý trơn tru phía sau và **đúng 50 sinh viên thành công**, không bị sập cũng không có người thứ 51 được phép lọt vào DB.