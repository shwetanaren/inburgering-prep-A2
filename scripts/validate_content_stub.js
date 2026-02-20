import fs from "node:fs";
import path from "node:path";

const CONTENT_DIR = path.resolve("content/v1.0.0");
const WEEK_MIN = 1;
const WEEK_MAX = 8;
const TOPIC_ENUM = new Set(["supermarket", "doctor", "greetings", "gemeente", "housing", "school", "work", "transport"]);
const ISO_UTC_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
const ARTICLE_ENUM = new Set(["de", "het", null]);

const REQUIRED = {
  words: ["id", "week", "topic", "lemma", "translation", "is_active", "updated_at"],
  lessons: ["id", "week", "title", "kind", "order_index", "payload", "updated_at"],
  dialogues: ["id", "week", "scenario", "title", "lines", "updated_at"],
  exercises: ["id", "week", "kind", "prompt", "data", "updated_at"],
};

function readJson(file) {
  const raw = fs.readFileSync(file, "utf8");
  return JSON.parse(raw);
}

function assertRequired(obj, required, label, errors) {
  for (const key of required) {
    if (!(key in obj)) errors.push(`${label}: missing required field '${key}'`);
  }
}

function validateFile(kind, items, errors, idIndex) {
  const required = REQUIRED[kind];
  for (const item of items) {
    assertRequired(item, required, `${kind}:${item.id ?? "(no id)"}`, errors);

    if (item.id && idIndex.has(item.id)) {
      errors.push(`${kind}:${item.id} duplicate id`);
    } else if (item.id) {
      idIndex.add(item.id);
    }

    if (typeof item.week === "number" && (item.week < WEEK_MIN || item.week > WEEK_MAX)) {
      errors.push(`${kind}:${item.id} week out of range (${item.week})`);
    }

    if (kind === "words") {
      if (!TOPIC_ENUM.has(item.topic)) {
        errors.push(`words:${item.id} invalid topic '${item.topic}'`);
      }
      if (!ARTICLE_ENUM.has(item.article ?? null)) {
        errors.push(`words:${item.id} invalid article '${item.article}'`);
      }
    }

    if (item.updated_at && !ISO_UTC_RE.test(item.updated_at)) {
      errors.push(`${kind}:${item.id} updated_at not ISO UTC Z`);
    }
  }
}

const files = {
  words: path.join(CONTENT_DIR, "words.json"),
  lessons: path.join(CONTENT_DIR, "lessons.json"),
  dialogues: path.join(CONTENT_DIR, "dialogues.json"),
  exercises: path.join(CONTENT_DIR, "exercises.json"),
};

const errors = [];
const idIndex = new Set();

for (const [kind, file] of Object.entries(files)) {
  if (!fs.existsSync(file)) {
    errors.push(`missing file: ${file}`);
    continue;
  }
  const items = readJson(file);
  if (!Array.isArray(items)) {
    errors.push(`${kind}: file is not an array`);
    continue;
  }
  validateFile(kind, items, errors, idIndex);
}

if (errors.length) {
  console.error("Content validation failed:\n" + errors.map((e) => `- ${e}`).join("\n"));
  process.exit(1);
}

console.log("Content validation passed.");
