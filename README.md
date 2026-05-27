# Hệ Thống Đăng Ký Học Phần Chịu Tải Cao

> **Kafka + Spark Streaming + Redis · Đồ án Big Data**

Hệ thống mô phỏng bài toán thực tế tại các trường đại học: hàng nghìn sinh viên tranh nhau đăng ký học phần cùng một lúc. Thay vì ghi thẳng vào cơ sở dữ liệu và gây nghẽn, hệ thống áp dụng kiến trúc **Event-Driven + Streaming** để dàn đều tải, phản hồi tức thì và đảm bảo tính toàn vẹn dữ liệu tuyệt đối.

---

## Mục Tiêu


| #   | Mục tiêu                 | Chi tiết                                                                  |
| --- | ------------------------ | ------------------------------------------------------------------------- |
| 1   | **Chịu tải cao**         | Xử lý hàng nghìn request đồng thời mà không sập                           |
| 2   | **Không trùng đăng ký**  | Một sinh viên chỉ được đăng ký một môn một lần                            |
| 3   | **Không vượt chỉ tiêu**  | Đúng N sinh viên được nhận, người thứ N+1 bị từ chối                      |
| 4   | **Xử lý race condition** | Atomic counter trên Redis ngăn overbooking khi nhiều request đến cùng lúc |
| 5   | **Phản hồi nhanh**       | API trả kết quả ngay lập tức, Spark xử lý nền không block người dùng      |


---

## Kiến Trúc Tổng Thể

```
┌──────────┐   HTTP POST    ┌───────────────────────────────────────────────┐
│          │ ─────────────► │  FastAPI Backend (Port 8000)                  │
│  React   │                │                                               │
│ Frontend │ ◄───────────── │  1. DECR quota:<course_id> trên Redis         │
│ (Port    │  "Đã ghi nhận" │     ├─ remaining < 0 → INCR (hoàn) → Lỗi 400  │
│  3000)   │   hoặc lỗi     │     └─ remaining ≥ 0 → Publish Kafka          │
└──────────┘                └───────┬───────────────────────┬───────────────┘
     │ GET /check                   │ Produce               │ DECR/INCR
     ▼                              ▼                       ▼
┌──────────┐              ┌──────────────────┐   ┌──────────────────────┐
│          │              │  Kafka           │   │  Redis               │
│PostgreSQL│              │  topic:          │   │  quota:<course_id>   │
│ (Port    │              │  registrations   │   └──────────────────────┘
│  5432)   │              └────────┬─────────┘
│          │                       │ Consume
│          │ ◄─────────────────────┤
│          │   INSERT / log event  │
└──────────┘                       ▼
                          ┌──────────────────────┐
                          │  Apache Spark        │
                          │  Structured Streaming│
                          │  (job.py)            │
                          │                      │
                          │  INSERT → PostgreSQL │
                          │  IntegrityError →    │
                          │    INCR Redis (hoàn) │
                          └──────────────────────┘
```

### Luồng xử lý chính

```
[1] Sinh viên bấm "Đăng ký"
        │
        ▼
[2] FastAPI nhận request — xử lý tại tầng API
    ├─ DECR quota trên Redis (atomic, in-memory)
    │   ├─ remaining < 0 → INCR Redis (hoàn slot) → Trả lỗi 400 "Hết chỗ"
    │   └─ remaining ≥ 0 → Publish event vào Kafka → Trả "Đã ghi nhận"
        │
        ▼
[3] Spark Streaming tiêu thụ event từ Kafka
    ├─ INSERT vào PostgreSQL
    │   ├─ Thành công → Ghi log success, tăng metrics
    │   └─ IntegrityError (trùng đăng ký) → Rollback + INCR Redis (hoàn slot) + Ghi log failed
        │
        ▼
[4] Frontend gọi GET /check → API truy vấn PostgreSQL
    → Hiển thị kết quả chính xác cuối cùng
```

### Vai trò từng thành phần


| Thành phần          | Vai trò                                                                                                               |
| ------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **React**           | Giao diện sinh viên & admin, hiển thị danh sách môn học, form đăng ký, lịch sử                                        |
| **FastAPI**         | API gateway: tiếp nhận request, **DECR Redis atomically** để giữ slot, publish event vào Kafka, trả kết quả tức thì   |
| **Kafka**           | Message broker — "phễu hứng" request, tách rời producer và consumer, chịu spike tải                                   |
| **Spark Streaming** | Xử lý luồng nền: đọc event từ Kafka, **INSERT vào PostgreSQL**; nếu trùng (`IntegrityError`) thì INCR Redis hoàn slot |
| **Redis**           | Atomic distributed counter — DECR tại tầng API đảm bảo không vượt quota dù hàng ngàn req đồng thời                    |
| **PostgreSQL**      | Source of truth — lưu trữ bền vững danh sách đăng ký và chỉ tiêu môn học                                              |


---

## Công Nghệ Sử Dụng


| Thành phần            | Công nghệ                         | Phiên bản      |
| --------------------- | --------------------------------- | -------------- |
| Giao diện người dùng  | React                             | 18.2           |
| HTTP Client           | Axios                             | 1.x            |
| UI Components         | React Bootstrap + Framer Motion   | 2.10 / 12.x    |
| Icon Set              | React Icons                       | 5.x            |
| Thông báo             | React Toastify                    | 11.x           |
| Điều hướng            | React Router DOM                  | 7.x            |
| API Backend           | FastAPI + Uvicorn                 | 0.100+ / 0.23+ |
| Message Broker        | Apache Kafka (Confluent)          | 7.4.0          |
| Coordination          | Apache Zookeeper (Confluent)      | 7.4.0          |
| Stream Processing     | Apache Spark Structured Streaming | 3.x            |
| Distributed Cache     | Redis                             | 7 (Alpine)     |
| Cơ sở dữ liệu         | PostgreSQL                        | 13             |
| Kafka Client (Python) | kafka-python                      | 2.0.2          |
| DB Adapter (Python)   | psycopg2-binary                   | 2.9+           |
| Redis Client (Python) | redis-py                          | 5.x            |
| Container hóa         | Docker + Docker Compose           | -              |


---

## Tính Năng Chính

### Sinh viên

- **Xem danh sách học phần** — tên môn, số chỗ còn lại cập nhật real-time
- **Đăng ký học phần** — nhận phản hồi tức thì ("Đã ghi nhận" / "Hết chỗ")
- **Kiểm tra trạng thái** — xác nhận đăng ký thành công dựa trên dữ liệu PostgreSQL

### Admin

- **Dashboard tổng quan** — thống kê tổng số đăng ký, tỉ lệ thành công/thất bại
- **Pipeline visualization** — theo dõi luồng dữ liệu qua từng tầng
- **Activity feed** — nhật ký sự kiện đăng ký theo thời gian thực

---

## Yêu Cầu Hệ Thống


| Yêu cầu         | Phiên bản tối thiểu                           |
| --------------- | --------------------------------------------- |
| Docker          | 20.x trở lên                                  |
| Docker Compose  | v2.x (tích hợp trong Docker Desktop)          |
| RAM khuyến nghị | ≥ 6 GB (Spark + Kafka + Redis chạy đồng thời) |
| OS              | Windows 10/11, macOS, Linux                   |


> Không cần cài Python, Node.js hay Java riêng — tất cả chạy trong container.

---

## Hướng Dẫn Cài Đặt & Chạy

Xem tài liệu đầy đủ từng bước tại **[SETUP.md](./SETUP.md)** — bao gồm khởi động hệ thống, đồng bộ Redis, kiểm thử tải, kiểm tra kết quả trong database và xem log Spark.

---

## Kết Quả Đạt Được

Hệ thống được kiểm thử bằng `load_test/simulate.py` với nhiều luồng đồng thời tranh nhau đăng ký một môn học có chỉ tiêu cố định. Kết quả xác nhận ba tính chất cốt lõi:

- **Không trùng đăng ký**: Constraint `UNIQUE(student_id, course_id)` tại PostgreSQL kết hợp cơ chế rollback Redis khi phát hiện `IntegrityError` — mọi bản ghi trùng đều bị loại bỏ và slot được hoàn trả.
- **Không vượt chỉ tiêu**: Lệnh `DECR` trên Redis là atomic — tại bất kỳ mức tải nào, số sinh viên được ghi vào DB luôn đúng bằng chỉ tiêu của môn học, không hơn không kém.
- **Xử lý race condition**: Spark xử lý tuần tự từng micro-batch; mọi xung đột ghi đồng thời đều được giải quyết ở tầng Redis trước khi chạm tới DB, không có write conflict.

---

## Cấu Trúc Thư Mục

```
Bigdata_Project/
├── api/                    # FastAPI backend
│   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile
├── spark/                  # Spark Streaming job
│   ├── job.py
│   ├── init_redis.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/               # React SPA
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.jsx
│   │   ├── pages/          # AdminDashboard, StudentPage, RoleSelectionPage
│   │   ├── components/
│   │   │   ├── admin/      # AdminHeader, Header, DashboardCards, PipelineViz, ActivityFeed
│   │   │   ├── student/    # StudentHeader, CourseList, CourseCard, RegisterForm, RegistrationHistory
│   │   │   └── shared/     # Layout, Loading, EmptyState, ThemeToggle
│   │   ├── contexts/       # ThemeContext.jsx — quản lý light/dark mode
│   │   ├── services/       # api.js — axios wrapper
│   │   └── styles/         # global.css, theme.css, admin.css, student.css
│   ├── nginx.conf
│   ├── package.json
│   └── Dockerfile
├── load_test/              # Script kiểm thử chịu tải
│   └── simulate.py
├── init-db.sql             # Khởi tạo schema + dữ liệu mẫu PostgreSQL
├── docker-compose.yml
└── ARCHITECTURE.md         # Tài liệu kiến trúc chi tiết
```

---

## Hướng Phát Triển


| Tính năng                  | Mô tả                                                                        |
| -------------------------- | ---------------------------------------------------------------------------- |
| **Waiting list**           | Sinh viên hết chỗ được xếp vào hàng chờ, tự động nhận chỗ khi có người hủy   |
| **Exactly-once semantics** | Tích hợp Kafka Transactions + Spark `foreachBatch` với idempotent write      |
| **WebSocket / SSE**        | Đẩy cập nhật số chỗ trống về frontend theo thời gian thực, không cần polling |
| **Kubernetes**             | Horizontal Pod Autoscaler cho API và Spark Worker, scale theo tải            |
| **Monitoring stack**       | Prometheus + Grafana theo dõi lag Kafka, throughput Spark, hit rate Redis    |
| **Authentication**         | JWT / OAuth2 tích hợp hệ thống SSO của trường                                |


---

## Thành Viên Nhóm

> *Trần Đặng Phi Hùng - 84802403240 (24DPM)*
>
> *Lê Duy Hùng - 64802403239 (24MMT)*

---

*Đồ án Big Data — Năm 2, Học kỳ 2 · Đại học Quốc tế Sài Gòn (SIU)*