CREATE TABLE IF NOT EXISTS registration_events (
    id         SERIAL PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL,
    course_id  VARCHAR(20) NOT NULL,
    status     VARCHAR(10) NOT NULL,
    reason     VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
('CS101', 100, 100),
('CS102', 100, 100),
('CS103', 100, 100),
('CS104', 100, 100),
('CS105', 100, 100),
('CS106', 100, 100),
('CS107', 100, 100),
('CS108', 100, 100),
('CS109', 100, 100),
('CS110', 100, 100),
('CS111', 100, 100);