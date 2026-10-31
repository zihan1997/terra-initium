#!/usr/bin/env python3

import json
import os
import sys
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
QUESTION_NAME = "InterviewQuestionList.json"


def question_path() -> Path:
    configured = os.getenv("INTERVIEW_DATA_DIR", "").strip()
    directory = Path(configured).expanduser() if configured else ROOT / "data" / "interview"
    return directory / QUESTION_NAME


def main() -> None:
    path = question_path()
    if not path.is_file():
        print(
            f"Interview question file '{QUESTION_NAME}' was not found. "
            "Set INTERVIEW_DATA_DIR or place the file in data/interview/.",
            file=sys.stderr,
        )
        raise SystemExit(1)

    records = json.loads(path.read_text(encoding="utf-8"))
    ids = [record["id"] for record in records if isinstance(record, dict) and "id" in record]
    used_ids = set(ids)
    next_id = max(used_ids) + 1 if used_ids else 1
    seen = Counter()
    rewrites: list[tuple[int, int, int]] = []

    for index, record in enumerate(records):
        if not isinstance(record, dict) or "id" not in record:
            continue

        current_id = record["id"]
        seen[current_id] += 1
        if seen[current_id] == 1:
            continue

        while next_id in used_ids:
            next_id += 1

        record["id"] = next_id
        used_ids.add(next_id)
        rewrites.append((index, current_id, next_id))
        next_id += 1

    path.write_text(
        json.dumps(records, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    print(f"updated {len(rewrites)} duplicate ids in {path}")
    for index, old_id, new_id in rewrites[:20]:
        print(f"row {index}: {old_id} -> {new_id}")
    if len(rewrites) > 20:
        print(f"... and {len(rewrites) - 20} more")


if __name__ == "__main__":
    main()
