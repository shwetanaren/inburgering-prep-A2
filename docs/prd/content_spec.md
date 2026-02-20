# Content Spec — v1.0.0

This spec defines the JSON content pack format that maps **1:1** to `docs/prd/data_contract.md` fields and invariants.

## Content Pack Layout

```
content/
  v1.0.0/
    words.json
    lessons.json
    dialogues.json
    exercises.json
```

## Stable ID Rules

- Words: `w_000001`, Lessons: `l_000001`, Dialogues: `d_000001`, Exercises: `e_000001`.
- IDs are **stable forever** once shipped. Never reassign or reuse an ID.
- **Content patching rule:** if a word changes text later, **keep the same `id`**, bump `updated_at`; never delete, only set `is_active = 0` if deprecated.

## Global Constraints

- `updated_at` is **ISO 8601 UTC** with `Z` (e.g., `2026-02-19T10:30:00Z`).
- `week` is an integer within **1–8** for `v1.0.0`.
- `topic` enum (v1.0.0): `"supermarket"`, `"doctor"`, `"greetings"`.
- `article` must be `"de"`, `"het"`, or `null`.
- Fields stored as JSON strings in SQLite (`tags`, `payload`, `lines`, `data`) are authored here as **native JSON** and serialized at ingest.

## Content Importer Rules

- **Tags:** accept `tags` as a JSON array in content files; store in DB as TEXT via `JSON.stringify(tags)` consistently.
- **Lessons:** store `payload` in DB as TEXT via `JSON.stringify(payload)`.
- **Dialogues:** store `lines` in DB as TEXT via `JSON.stringify(lines)`.
- **Exercises:** store `data` in DB as TEXT via `JSON.stringify(data)`.

## JSON Schemas

### 1) Words (`content/v1.0.0/words.json`)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "WordsFile",
  "type": "array",
  "items": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "id",
      "week",
      "topic",
      "lemma",
      "translation",
      "is_active",
      "updated_at"
    ],
    "properties": {
      "id": { "type": "string", "pattern": "^w_\\d{6}$" },
      "week": { "type": "integer", "minimum": 1, "maximum": 8 },
      "topic": { "type": "string", "enum": ["supermarket", "doctor", "greetings", "gemeente", "housing", "school", "work", "transport"] },
      "lemma": { "type": "string", "minLength": 1 },
      "article": { "type": ["string", "null"], "enum": ["de", "het", null] },
      "translation": { "type": "string", "minLength": 1 },
      "example_nl": { "type": ["string", "null"] },
      "example_en": { "type": ["string", "null"] },
      "audio_uri": { "type": ["string", "null"] },
      "tags": {
        "type": "array",
        "items": { "type": "string" }
      },
      "is_active": { "type": "integer", "enum": [0, 1] },
      "updated_at": {
        "type": "string",
        "pattern": "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z$"
      }
    }
  }
}
```

### 2) Lessons (`content/v1.0.0/lessons.json`)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "LessonsFile",
  "type": "array",
  "items": {
    "type": "object",
    "additionalProperties": false,
    "required": ["id", "week", "title", "kind", "order_index", "payload", "updated_at"],
    "properties": {
      "id": { "type": "string", "pattern": "^l_\\d{6}$" },
      "week": { "type": "integer", "minimum": 1, "maximum": 8 },
      "title": { "type": "string", "minLength": 1 },
      "kind": { "type": "string", "enum": ["vocab", "sentence", "dialogue"] },
      "order_index": { "type": "integer", "minimum": 0 },
      "payload": {
        "oneOf": [
          {
            "type": "object",
            "additionalProperties": false,
            "required": ["word_ids"],
            "properties": {
              "word_ids": {
                "type": "array",
                "items": { "type": "string", "pattern": "^w_\\d{6}$" },
                "minItems": 1
              },
              "intro_nl": { "type": "string" },
              "intro_en": { "type": "string" }
            }
          },
          {
            "type": "object",
            "additionalProperties": false,
            "required": [
              "pattern_code",
              "pattern_title",
              "pattern_title_en",
              "pattern_desc",
              "pattern_desc_en",
              "example",
              "sentences"
            ],
            "properties": {
              "pattern_code": { "type": "string", "enum": ["A", "B", "C", "D", "E", "F", "G"] },
              "pattern_title": { "type": "string", "minLength": 1 },
              "pattern_title_en": { "type": "string", "minLength": 1 },
              "pattern_desc": { "type": "string", "minLength": 1 },
              "pattern_desc_en": { "type": "string", "minLength": 1 },
              "example": {
                "type": "object",
                "additionalProperties": false,
                "required": ["nl", "en"],
                "properties": {
                  "nl": { "type": "string", "minLength": 1 },
                  "en": { "type": "string", "minLength": 1 }
                }
              },
              "sentences": {
                "type": "array",
                "minItems": 3,
                "items": {
                  "type": "object",
                  "additionalProperties": false,
                  "required": ["nl", "en"],
                  "properties": {
                    "nl": { "type": "string", "minLength": 1 },
                    "en": { "type": "string", "minLength": 1 }
                  }
                }
              },
              "word_ids": {
                "type": "array",
                "items": { "type": "string", "pattern": "^w_\\d{6}$" }
              }
            }
          }
        ]
      },
      "updated_at": {
        "type": "string",
        "pattern": "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z$"
      }
    }
  }
}
```

### 3) Dialogues (`content/v1.0.0/dialogues.json`)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "DialoguesFile",
  "type": "array",
  "items": {
    "type": "object",
    "additionalProperties": false,
    "required": ["id", "week", "scenario", "title", "lines", "updated_at"],
    "properties": {
      "id": { "type": "string", "pattern": "^d_\\d{6}$" },
      "week": { "type": "integer", "minimum": 1, "maximum": 8 },
      "scenario": { "type": "string", "enum": ["supermarket", "doctor", "greetings", "gemeente", "housing", "school", "work", "transport"] },
      "title": { "type": "string", "minLength": 1 },
      "lines": {
        "type": "array",
        "minItems": 2,
        "items": {
          "type": "object",
          "additionalProperties": false,
          "required": ["speaker", "nl", "en"],
          "properties": {
            "speaker": { "type": "string", "minLength": 1 },
            "nl": { "type": "string", "minLength": 1 },
            "en": { "type": "string", "minLength": 1 }
          }
        }
      },
      "updated_at": {
        "type": "string",
        "pattern": "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z$"
      }
    }
  }
}
```

### 4) Exercises (`content/v1.0.0/exercises.json`)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "ExercisesFile",
  "type": "array",
  "items": {
    "type": "object",
    "additionalProperties": false,
    "required": ["id", "week", "kind", "prompt", "data", "updated_at"],
    "properties": {
      "id": { "type": "string", "pattern": "^e_\\d{6}$" },
      "week": { "type": "integer", "minimum": 1, "maximum": 8 },
      "kind": { "type": "string", "minLength": 1 },
      "prompt": { "type": "string", "minLength": 1 },
      "data": { "type": "object" },
      "updated_at": {
        "type": "string",
        "pattern": "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z$"
      }
    }
  }
}
```

## Validation Checklist

- Duplicate IDs within each file and across files
- Missing required fields for each entity
- `article` in `{ "de", "het", null }`
- `week` in range **1–8**
- `topic` in enum `{ "supermarket", "doctor", "greetings", "gemeente", "housing", "school", "work", "transport" }`
- `updated_at` matches ISO UTC `YYYY-MM-DDTHH:MM:SSZ`

## Optional Validation Script Stub

See `scripts/validate_content_stub.js` for a minimal validator that checks the checklist above.
