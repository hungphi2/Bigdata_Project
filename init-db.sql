CREATE TABLE IF NOT EXISTS registrations (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL,
    course_id VARCHAR(20) NOT NULL,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, course_id)
);

CREATE TABLE IF NOT EXISTS course_quota (
    course_id VARCHAR(20) PRIMARY KEY,
    total_quota INTEGER NOT NULL,
    remaining INTEGER NOT NULL
);

INSERT INTO course_quota (
    course_id,
    total_quota,
    remaining
)
VALUES
('CS101', 50, 50),
('CS102', 30, 30);
