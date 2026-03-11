#!/usr/bin/env python3

import json
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
QUESTION_PATH = ROOT / "app" / "static" / "InterviewQuestionList.json"


def main() -> None:
    records = json.loads(QUESTION_PATH.read_text(encoding="utf-8"))
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

    QUESTION_PATH.write_text(
        json.dumps(records, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    print(f"updated {len(rewrites)} duplicate ids in {QUESTION_PATH}")
    for index, old_id, new_id in rewrites[:20]:
        print(f"row {index}: {old_id} -> {new_id}")
    if len(rewrites) > 20:
        print(f"... and {len(rewrites) - 20} more")


if __name__ == "__main__":
    main()
