import requests
import concurrent.futures
import random
import time
import threading

BASE_URL = "http://localhost:8000"

COURSES = [
    "CS101",
    "CS102",
    "CS103",
    "CS104",
    "CS105",
    "CS106",
    "CS107",
    "CS108",
    "CS109",
    "CS110",
    "CS111",
]

DEFAULT_NUM_REQUESTS = 100000
DEFAULT_CONCURRENCY  = 100
PROGRESS_EVERY       = 1000   # print progress every N completed requests


def prompt_int(prompt_text, default):
    """Ask for a positive integer, fall back to default on empty input."""
    while True:
        raw = input(f"{prompt_text} (default: {default}): ").strip()
        if raw == "":
            return default
        try:
            value = int(raw)
            if value <= 0:
                raise ValueError
            return value
        except ValueError:
            print(f"  [!] Invalid input — please enter a positive integer.\n")

# Thread-safe counters
_lock            = threading.Lock()
_processed       = 0
_accepted        = 0
_rejected        = 0
_errors          = 0


def _increment(status_code):
    global _processed, _accepted, _rejected, _errors
    with _lock:
        _processed += 1
        if status_code == 200:
            _accepted += 1
        elif status_code == 500:
            _errors += 1
        else:
            _rejected += 1

        if _processed % PROGRESS_EVERY == 0:
            print(
                f"[PROGRESS] processed={_processed:<7} "
                f"accepted={_accepted:<7} "
                f"rejected={_rejected:<7} "
                f"errors={_errors}"
            )


def register(student_id):
    course = random.choice(COURSES)
    try:
        resp = requests.post(
            f"{BASE_URL}/register",
            params={"student_id": student_id, "course_id": course},
            timeout=2
        )
        status_code = resp.status_code

        if status_code == 200:
            print(
                f"[SUCCESS] student={student_id:<12} "
                f"course={course}  status=ACCEPTED"
            )
        else:
            try:
                reason = resp.json().get("detail", "unknown")
            except Exception:
                reason = resp.text or "unknown"
            print(
                f"[FAILED]  student={student_id:<12} "
                f"course={course}  status=REJECTED  reason={reason}"
            )

    except requests.exceptions.Timeout:
        status_code = 500
        print(
            f"[ERROR]   student={student_id:<12} "
            f"course={course}  reason=timeout"
        )
    except Exception as exc:
        status_code = 500
        print(
            f"[ERROR]   student={student_id:<12} "
            f"course={course}  reason={exc}"
        )

    _increment(status_code)
    return status_code


if __name__ == "__main__":
    NUM_REQUESTS = prompt_int("Enter total requests", DEFAULT_NUM_REQUESTS)
    CONCURRENCY  = prompt_int("Enter concurrent workers", DEFAULT_CONCURRENCY)
    print()

    print(f"[START]  Starting simulation...")
    print(f"[CONFIG] Total requests    : {NUM_REQUESTS}")
    print(f"[CONFIG] Concurrent workers: {CONCURRENCY}")
    print(f"[CONFIG] Progress interval : every {PROGRESS_EVERY} requests")
    print(f"[CONFIG] Target URL        : {BASE_URL}")
    print()

    t_start = time.time()

    with concurrent.futures.ThreadPoolExecutor(max_workers=CONCURRENCY) as executor:
        futures = [
            executor.submit(register, f"student_{i}")
            for i in range(NUM_REQUESTS)
        ]
        [f.result() for f in concurrent.futures.as_completed(futures)]

    elapsed      = time.time() - t_start
    rps          = NUM_REQUESTS / elapsed if elapsed > 0 else 0
    success_rate = (_accepted / NUM_REQUESTS * 100) if NUM_REQUESTS > 0 else 0

    print()
    print("=" * 40)
    print("SIMULATION SUMMARY")
    print("=" * 40)
    print(f"Total Requests : {NUM_REQUESTS}")
    print(f"Queued (HTTP 200)  : {_accepted}   ← accepted into Kafka, not yet in DB")
    print(f"Rejected (4xx)     : {_rejected}   ← quota_full / course_not_found")
    print(f"Errors/Timeout     : {_errors}")
    print(f"Success Rate   : {success_rate:.2f}%")
    print(f"Elapsed Time   : {elapsed:.2f} sec")
    print(f"Requests/sec   : {rps:.0f}")
    print("=" * 40)
    print(f"Note: actual DB commits = GET /metrics → 'successful'")
    print("=" * 40)
