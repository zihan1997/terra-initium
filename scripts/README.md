# Scripts

## Fix Duplicate Question IDs

Use `fix_question_ids.py` when `InterviewQuestionList.json` contains duplicate `id` values.

This matters because the `ui` uses `question.id` for more than display:

- React list keys
- mock interview selection state
- question lookup during audio submission
- results mapping

If duplicate ids exist, filtering, selection, scoring, or results can behave incorrectly.

Run:

```bash
python3 scripts/fix_question_ids.py
```

What it does:

- keeps the first occurrence of each existing `id`
- rewrites later duplicates to new unique ids
- writes the updated JSON back to `data/interview/InterviewQuestionList.json`, or to `$INTERVIEW_DATA_DIR/InterviewQuestionList.json` when that variable is set

The question bank is not stored in the repo. Place the file in `data/interview/` (or set `INTERVIEW_DATA_DIR`) before running the script. The script exits with an error if the file is missing.
