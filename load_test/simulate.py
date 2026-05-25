import requests
import concurrent.futures
import random

BASE_URL = "http://localhost:8000"

COURSES = [
    "CS101",
    "CS102"
]

NUM_REQUESTS = 5000
CONCURRENCY = 100

def register(student_id):
    course = random.choice(COURSES)
    try:
        return requests.post(
            f"{BASE_URL}/register",
            params={
                "student_id": student_id,
                "course_id": course
            },
            timeout=2
        ).status_code
    except:
        return 500

if __name__ == "__main__":
    with concurrent.futures.ThreadPoolExecutor(max_workers=CONCURRENCY) as executor:
        futures = [
            executor.submit(register, f"student_{i}")
            for i in range(NUM_REQUESTS)
        ]
        results = [f.result() for f in futures]

    success = sum(1 for r in results if r == 200)
    print(f"Total: {NUM_REQUESTS}, accepted: {success}")
