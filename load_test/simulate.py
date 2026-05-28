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

DEFAULT_NUM_REQUESTS = 10000
DEFAULT_CONCURRENCY  = 1000

# How long to wait for Spark to flush remaining batches before /metrics check
SPARK_FLUSH_WAIT_SEC = 10


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

# Track accepted (student_id, course_id) pairs for duplicate test
_accepted_pairs  = []


def _increment(status_code, student_id=None, course_id=None, total=None):
    global _processed, _accepted, _rejected, _errors
    with _lock:
        _processed += 1
        if status_code == 200:
            _accepted += 1
            if student_id and course_id:
                _accepted_pairs.append((student_id, course_id))
        elif status_code == 500:
            _errors += 1
        else:
            _rejected += 1

        if total:
            print(
                f"\r[PHASE 1] {_processed:>6}/{total}"
                f" | Accepted: {_accepted}"
                f" | Rejected: {_rejected}"
                f" | Errors: {_errors}",
                end='', flush=True
            )


def register(student_id, total=None):
    course = random.choice(COURSES)
    try:
        resp        = requests.post(
            f"{BASE_URL}/register",
            params={"student_id": student_id, "course_id": course},
            timeout=10
        )
        status_code = resp.status_code
    except requests.exceptions.Timeout:
        status_code = 500
    except Exception:
        status_code = 500

    _increment(status_code, student_id, course, total=total)
    return status_code, course


# ---------------------------------------------------------------------------
# Phase 1: Main load simulation
# ---------------------------------------------------------------------------

def run_phase1(num_requests, concurrency):
    global _processed, _accepted, _rejected, _errors
    _processed = 0
    _accepted  = 0
    _rejected  = 0
    _errors    = 0
    _accepted_pairs.clear()

    print(f"[START]  Starting simulation...")
    print(f"[CONFIG] Total requests    : {num_requests}")
    print(f"[CONFIG] Concurrent workers: {concurrency}")
    print(f"[CONFIG] Target URL        : {BASE_URL}")
    print()

    t_start = time.time()

    with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as executor:
        futures = [
            executor.submit(register, f"student_{i}", num_requests)
            for i in range(num_requests)
        ]
        [f.result() for f in concurrent.futures.as_completed(futures)]

    print("  ... done")
    elapsed      = time.time() - t_start
    rps          = num_requests / elapsed if elapsed > 0 else 0
    success_rate = (_accepted / num_requests * 100) if num_requests > 0 else 0

    print()
    print("=" * 40)
    print("PHASE 1 — SIMULATION SUMMARY")
    print("=" * 40)
    print(f"Total Requests     : {num_requests}")
    print(f"Queued (HTTP 200)  : {_accepted}   ← accepted into Kafka")
    print(f"Rejected (4xx)     : {_rejected}   ← quota_full / course_not_found")
    print(f"Errors/Timeout     : {_errors}")
    print(f"Success Rate       : {success_rate:.2f}%")
    print(f"Elapsed Time       : {elapsed:.2f} sec")
    print(f"Requests/sec       : {rps:.0f}")
    print("=" * 40)

    return _accepted


# ---------------------------------------------------------------------------
# Phase 2: Duplicate registration test
# ---------------------------------------------------------------------------

def run_phase2(concurrency):
    """Re-send already-accepted (student_id, course_id) pairs.

    Every single one must be rejected — either 400 (quota_full, since the
    slot was already consumed) or a DB-level duplicate error.  Zero HTTP 200
    responses means the system correctly prevents duplicate registrations.
    """
    if not _accepted_pairs:
        print("\n[DUPLICATE TEST] No accepted pairs to replay — skipping.")
        return

    sample = _accepted_pairs[:100] if len(_accepted_pairs) > 100 else _accepted_pairs[:]
    total  = len(sample)

    print()
    print("=" * 40)
    print("PHASE 2 — DUPLICATE REGISTRATION TEST")
    print("=" * 40)
    print(f"Replaying {total} already-accepted (student, course) pairs...")
    print(f"Expected: ALL must be rejected (HTTP 4xx)")
    print()

    dup_accepted = 0
    dup_rejected = 0
    dup_errors   = 0
    dup_done     = 0
    _dup_lock    = threading.Lock()

    def _redraw_progress():
        """Overwrite the current line with latest counters."""
        print(
            f"\r[DUP TEST] {dup_done:>4}/{total}"
            f" | Rejected: {dup_rejected}"
            f" | Accepted: {dup_accepted}",
            end='', flush=True
        )

    def send_duplicate(pair):
        nonlocal dup_accepted, dup_rejected, dup_errors, dup_done
        sid, cid = pair
        try:
            resp = requests.post(
                f"{BASE_URL}/register",
                params={"student_id": sid, "course_id": cid},
                timeout=10
            )
            code = resp.status_code
            try:
                reason = resp.json().get("detail", "")
            except Exception:
                reason = resp.text or ""
        except Exception as exc:
            code   = 500
            reason = str(exc)

        with _dup_lock:
            dup_done += 1
            if code == 200:
                dup_accepted += 1
                # Break out of the progress line, then warn
                print()
                print(
                    f"[DUP-WARN] student={sid:<12} course={cid}"
                    f"  INCORRECTLY ACCEPTED! reason={reason}"
                )
            elif code == 500:
                dup_errors += 1
                print()
                print(f"[DUP-ERROR] student={sid} course={cid} reason={reason}")
            else:
                dup_rejected += 1
            _redraw_progress()

        return code

    with concurrent.futures.ThreadPoolExecutor(max_workers=min(concurrency, total)) as ex:
        list(ex.map(send_duplicate, sample))

    # Move past the progress line
    print("  ... done")

    passed = dup_accepted == 0
    print()
    print("=" * 40)
    print("PHASE 2 — DUPLICATE TEST RESULT")
    print("=" * 40)
    print(f"Duplicate requests sent : {total}")
    print(f"Incorrectly accepted    : {dup_accepted}  ← must be 0")
    print(f"Correctly rejected      : {dup_rejected}")
    print(f"Errors                  : {dup_errors}")
    print(f"Result : {'PASSED ✓  — no duplicate registrations' if passed else 'FAILED ✗  — duplicates were accepted!'}")
    print("=" * 40)


# ---------------------------------------------------------------------------
# Phase 3: DB commit verification via /metrics
# ---------------------------------------------------------------------------

def get_metrics_baseline():
    """Snapshot DB counters before the test run to enable delta comparison."""
    try:
        resp = requests.get(f"{BASE_URL}/metrics", timeout=10)
        m    = resp.json()
        return m.get("successful", 0), m.get("failed", 0)
    except Exception as e:
        print(f"[METRICS] Warning: could not fetch baseline metrics: {e}")
        return 0, 0


def run_metrics_check(kafka_accepted, baseline_ok=0, baseline_fail=0, wait_sec=SPARK_FLUSH_WAIT_SEC):
    """Poll /metrics until Spark has flushed all batches, then verify.

    Uses delta against baseline to ignore records from previous runs or
    manual registrations that existed before this test started.
    """
    print()
    print(f"[METRICS] Waiting {wait_sec}s for Spark to flush remaining batches...")
    time.sleep(wait_sec)

    for attempt in range(1, 4):
        try:
            resp = requests.get(f"{BASE_URL}/metrics", timeout=10)
            m    = resp.json()

            db_ok_total   = m.get("successful", 0)
            db_fail_total = m.get("failed", 0)
            quota         = m.get("totalQuotaLeft", "?")

            # Delta: only count records written during this test run
            delta_ok   = db_ok_total   - baseline_ok
            delta_fail = db_fail_total - baseline_fail

            over_quota = delta_ok > kafka_accepted
            match      = delta_ok == kafka_accepted

            print()
            print("=" * 40)
            print("PHASE 3 — DB COMMIT VERIFICATION (/metrics)")
            print("=" * 40)
            print(f"Kafka accepted (HTTP 200) : {kafka_accepted}")
            print(f"DB successful (this run)  : {delta_ok}  (total all-time: {db_ok_total})")
            print(f"DB failed     (this run)  : {delta_fail}  (total all-time: {db_fail_total})")
            print(f"Quota remaining (all)     : {quota}")
            print(f"Over-quota?  : {'NO  ✓' if not over_quota else 'YES ✗  ← BUG!'}")
            print(f"Kafka→DB match? : {'YES ✓' if match else f'NOT YET — Spark still processing (attempt {attempt}/3)'}")
            print("=" * 40)

            if match:
                break
            if attempt < 3:
                print(f"[METRICS] Retrying in 5s...")
                time.sleep(5)

        except Exception as e:
            print(f"[METRICS] Could not fetch /metrics: {e}")
            break


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    NUM_REQUESTS = prompt_int("Enter total requests", DEFAULT_NUM_REQUESTS)
    CONCURRENCY  = prompt_int("Enter concurrent workers", DEFAULT_CONCURRENCY)
    print()

    baseline_ok, baseline_fail = get_metrics_baseline()

    kafka_accepted = run_phase1(NUM_REQUESTS, CONCURRENCY)
    run_phase2(CONCURRENCY)
    run_metrics_check(kafka_accepted, baseline_ok, baseline_fail)
