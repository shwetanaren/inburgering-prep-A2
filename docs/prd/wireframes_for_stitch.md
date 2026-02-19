# InburgeringPrep — MVP Wireframes for Stitch
> Feed this to Stitch as layout + field guidance.
> Design language: match the Home + Lesson screenshots already built.
> Platform: iOS mobile, portrait only.

---

## SCREEN 1 — HOME (Today Plan)

```
┌─────────────────────────────────────┐
│  [NL]  InburgeringPrep      [⚙️ gear] │  ← TopAppBar
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🔥 4-day streak             │    │  ← streak (streakCurrent)
│  │    "Keep it up!"            │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  TODAY'S GOAL        3/10   │    │  ← reviewsTodayCount / dailyGoal
│  │  [━━━━━━━░░░░░░░░░░░░░░░░]  │    │  ← progress bar
│  │  7 words due                │    │  ← dueCount
│  │                             │    │
│  │  [ Start Review ──────── →] │    │  ← PRIMARY CTA (blue, full-width)
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  📖 LESSON                  │    │  ← section label
│  │  Week 1: Grammar A-G  ●●○   │    │  ← LessonSummaryDTO.title
│  │  In progress →              │    │  ← progressStatus chip
│  └─────────────────────────────┘    │  ← tap → Lesson screen
│                                     │
│  ┌─────────────────────────────┐    │
│  │  💬 DIALOGUE                │    │  ← section label
│  │  At the gemeente            │    │  ← DialogueSummaryDTO.scenario
│  │  Registering at the         │    │  ← DialogueSummaryDTO.title
│  │  municipality →             │    │
│  └─────────────────────────────┘    │  ← tap → Dialogue screen
│                                     │
└─────────────────────────────────────┘
│ [🏠 Home] [🔁 Review] [📖 Lesson] [💬] [📊] │  ← Bottom Tab Bar
```

**Field map:**
- Streak number → `progress.streakCurrent`
- Bar fill → `progress.reviewsTodayCount ÷ progress.dailyGoal`
- "X words due" → `progress.dueCount`
- Lesson card title → `lessons[0].title`
- Lesson status chip → `lessons[0].progressStatus` (not_started / in_progress / done)
- Dialogue card → `dialogues[0].scenario` + `dialogues[0].title`

**Do NOT show:** streakBest, contentVersion, any IDs, ISO timestamps, lastActiveAt

---

## SCREEN 2 — REVIEW SESSION

### 2a. Card — Front (question side)

```
┌─────────────────────────────────────┐
│  ←  Review              Card 1 of 7 │  ← TopAppBar + local counter
├─────────────────────────────────────┤
│                                     │
│         [Housing]                   │  ← word.topic (small chip)
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │       de woning             │    │  ← article + lemma (LARGE)
│  │                             │    │
│  │         🔊                  │    │  ← audioUri play button
│  │                             │    │
│  └─────────────────────────────┘    │  ← tap card to flip
│                                     │
│      Tap to reveal meaning          │  ← hint label
│                                     │
└─────────────────────────────────────┘
```

### 2b. Card — Back (answer revealed)

```
┌─────────────────────────────────────┐
│  ←  Review              Card 1 of 7 │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐    │
│  │  de woning                  │    │  ← article + lemma
│  │  ─────────────────────────  │    │
│  │  home / dwelling            │    │  ← word.translation (prominent)
│  │                             │    │
│  │  "Ik zoek een woning        │    │  ← word.exampleNl (italic)
│  │   in Amsterdam."            │    │
│  │  I am looking for a home    │    │  ← word.exampleEn (muted, smaller)
│  │  in Amsterdam.              │    │
│  └─────────────────────────────┘    │
│                                     │
│  How did that feel?                 │  ← rating prompt label
│                                     │
│  ┌────────┐ ┌────────┐ ┌────────┐   │
│  │ Again  │ │  Good  │ │  Easy  │   │  ← RatingButtons (Again/Good/Easy)
│  └────────┘ └────────┘ └────────┘   │
│                                     │
└─────────────────────────────────────┘
```

**Field map:**
- Front: `word.article` + `word.lemma`, `word.topic`, `word.audioUri`
- Back: `word.translation`, `word.exampleNl`, `word.exampleEn`
- Rating buttons → triggers `recordReview(wordId, rating)`

**Do NOT show:** box number, nextReviewAt, SRS state fields, prevBox/nextBox, scheduledAt

---

## SCREEN 3 — LESSON

```
┌─────────────────────────────────────┐
│  ←  Week 1: Grammar          [ℹ️]   │  ← TopAppBar (lesson.title + info icon)
├─────────────────────────────────────┤
│                                     │
│  [ STEP 1 OF 8 ]                    │  ← StepBadge pill
│                                     │
│  The A-G Framework                  │  ← derived section heading
│  Master these 7 fundamental Dutch   │  ← payload.introEn
│  sentence patterns to pass the      │
│  A2 exam with confidence.           │
│                                     │
│  ┌──────────────────────────────┐   │
│  │ [A]  Basic Sentence    [▶]   │   │  ← ACTIVE step (blue border)
│  │      START HERE              │   │
│  │  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │   │
│  │  Subject + Verb + Rest       │   │  ← word.translation (pattern)
│  │  "Ik leer Nederlands."       │   │  ← word.exampleNl
│  └──────────────────────────────┘   │
│                                     │
│  ┌──────────────────────────────┐   │
│  │ [B]  Inversion         [🔒]  │   │  ← LOCKED step (gray border)
│  │      "Morgen leer ik..."     │   │
│  └──────────────────────────────┘   │
│                                     │
│  ┌──────────────────────────────┐   │
│  │ [C]  Basic Conjunctions [🔒] │   │
│  │      "En, maar, of..."       │   │
│  └──────────────────────────────┘   │
│                                     │
│  ... (D, E, F, G same pattern)      │
│                                     │
│  ┌──────────────────────────────┐   │
│  │ 💡 Why this framework?       │   │  ← InfoTipCard (hardcoded copy)
│  │  Most exam questions focus   │   │
│  │  on word order...            │   │
│  └──────────────────────────────┘   │
│                                     │
│  [ Start Pattern A ──────────── →]  │  ← PRIMARY CTA (updates per step)
└─────────────────────────────────────┘
│ [🏠 Home] [🔁 Review] [📖 Lesson] [💬] [📊] │
```

**Step card states:**
```
ACTIVE:    Blue border │ Blue [A] badge │ ▶ play icon │ expanded content visible
LOCKED:    Gray border │ Gray [B] badge │ 🔒 lock icon │ content muted
COMPLETED: Gray border │ Green [A] badge│ ✓ check icon │ content muted
```

**Field map:**
- TopAppBar title → `lesson.title`
- Intro text → `payload.introEn`
- Each step → one item from `lesson.words[]` (lemma = step title, exampleNl = quote)
- CTA label → "Start Pattern [letter]" (updates to active step letter)
- Step counter → local index / `lesson.words.length`

**Do NOT show:** lessonId, orderIndex, kind, updatedAt, lastActivityAt, completedAt, wordId

---

## SCREEN 4 — DIALOGUE

```
┌─────────────────────────────────────┐
│  ←  Registering at the...           │  ← TopAppBar (dialogue.title)
├─────────────────────────────────────┤
│                                     │
│  [ AT THE GEMEENTE ]                │  ← dialogue.scenario (badge pill)
│                                     │
│  ┌──────────────────────┐           │
│  │ Ambtenaar            │           │  ← left bubble (other speaker)
│  │ Goedemiddag,         │           │  ← line.nl
│  │ waarmee kan ik u     │           │
│  │ helpen?              │           │
│  │ Good afternoon, how  │           │  ← line.en (muted, smaller)
│  │ can I help you?      │           │
│  └──────────────────────┘           │
│                                     │
│           ┌──────────────────────┐  │
│           │              Jij     │  │  ← right bubble (user)
│           │ Ik wil mij           │  │  ← line.nl
│           │ inschrijven.         │  │
│           │ I want to register.  │  │  ← line.en (muted)
│           └──────────────────────┘  │
│                                     │
│  ┌──────────────────────┐           │
│  │ Ambtenaar            │           │
│  │ Heeft u een paspoort │           │
│  │ bij u?               │           │
│  │ Do you have a        │           │
│  │ passport with you?   │           │
│  └──────────────────────┘           │
│                                     │
│           ┌──────────────────────┐  │
│           │              Jij     │  │
│           │ Ja, hier is mijn     │  │
│           │ paspoort.            │  │
│           │ Yes, here is my      │  │
│           │ passport.            │  │
│           └──────────────────────┘  │
│                                     │
│  [ Finish Practice ────────────── ] │  ← PRIMARY CTA
└─────────────────────────────────────┘
│ [🏠 Home] [🔁 Review] [📖 Lesson] [💬] [📊] │
```

**Bubble alignment rule:**
- `speaker === "Jij"` (or user role) → right-aligned, blue bubble
- All other speakers → left-aligned, white/gray bubble, speaker name shown above

**Field map:**
- TopAppBar → `dialogue.title`
- Scenario badge → `dialogue.scenario`
- Each bubble → `line.nl` (main) + `line.en` (subtitle, muted)
- Speaker label → `line.speaker`

**Do NOT show:** dialogueId, week, updatedAt — no save/progress indicator anywhere

---

## SCREEN 5 — PROGRESS

```
┌─────────────────────────────────────┐
│  Progress                           │  ← TopAppBar (no back arrow, it's a tab)
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐    │
│  │     🔥  4                   │    │  ← streakCurrent (HERO stat)
│  │     Day streak              │    │
│  │     Best: 12 days           │    │  ← streakBest (secondary)
│  └─────────────────────────────┘    │
│                                     │
│  ┌────────────┐  ┌────────────┐     │
│  │  TODAY     │  │  ALL TIME  │     │  ← StatTile pair
│  │  6 / 10    │  │  87        │     │  ← reviewsToday/dailyGoal | totalReviews
│  │  reviewed  │  │  reviews   │     │
│  └────────────┘  └────────────┘     │
│                                     │
│  ┌────────────┐                     │
│  │  DUE NOW   │                     │  ← StatTile
│  │  4 words   │                     │  ← dueCount
│  └────────────┘                     │
│                                     │
│  Last reviewed: Today at 9:15 AM    │  ← lastReviewedAt (human-readable)
│                                     │
│  [ Start Review ────────────── →]   │  ← CTA only if dueCount > 0
└─────────────────────────────────────┘
│ [🏠 Home] [🔁 Review] [📖 Lesson] [💬] [📊] │
```

**Field map:**
- Hero → `progress.streakCurrent`
- Best → `progress.streakBest`
- Today fraction → `progress.reviewsTodayCount` / `progress.dailyGoal`
- All time → `progress.totalReviews`
- Due → `progress.dueCount`
- Footer → `progress.lastReviewedAt` formatted as human date

**Do NOT show:** contentVersion, lastActiveAt, raw ISO strings

---

## SCREEN 6 — SETTINGS

```
┌─────────────────────────────────────┐
│  ←  Settings                        │  ← TopAppBar
├─────────────────────────────────────┤
│                                     │
│  LEARNING                           │  ← section header
│  ┌─────────────────────────────┐    │
│  │ Daily goal          [ 10 ]  │    │  ← dailyGoal stepper (5–30)
│  │ Words per day               │    │
│  └─────────────────────────────┘    │
│                                     │
│  NOTIFICATIONS                      │  ← section header
│  ┌─────────────────────────────┐    │
│  │ Daily reminder    [  ●  ]   │    │  ← notificationsEnabled toggle
│  │ Get a nudge each day        │    │
│  └─────────────────────────────┘    │
│                                     │
│  ABOUT                              │  ← section header
│  ┌─────────────────────────────┐    │
│  │ DUO Standards       v1.0    │    │  ← static copy
│  └─────────────────────────────┘    │
│                                     │
│  [ Save ───────────────────────── ] │  ← PRIMARY CTA (enabled on change only)
└─────────────────────────────────────┘
```

**Field map:**
- Stepper value → `settings.dailyGoal`
- Toggle → `settings.notificationsEnabled`
- Save → calls `updateSettings({ dailyGoal, notificationsEnabled })`
- On success → "Goal saved ✓" Toast appears

**Do NOT show:** any DB fields, user IDs, or technical settings

---

## SCREEN 7 — SESSION SUMMARY (Stack Overlay)

```
┌─────────────────────────────────────┐
│                                     │  ← No TopAppBar (full overlay)
│                                     │
│       ✅  Review Complete!          │  ← session type label
│                                     │
│  ┌─────────────────────────────┐    │
│  │   🔥 4    │    7    │  3✓   │    │
│  │  Streak   │  Cards  │  Due  │    │  ← streakCurrent | session count | dueCount
│  └─────────────────────────────┘    │
│                                     │
│       6 of 10 done today            │  ← reviewsTodayCount / dailyGoal
│  [━━━━━━━━━━━━░░░░░░░░░░░░░░░░]    │  ← progress bar
│                                     │
│       Next review in ~4 hours       │  ← human-readable hint (optional)
│                                     │
│  [ Back to Home ────────────── ]    │  ← PRIMARY CTA
│  [ Start Lesson ────────────── ]    │  ← SECONDARY CTA (outline style)
│                                     │
└─────────────────────────────────────┘
```

**Field map:**
- Streak → `reviewResult.progress.streakCurrent`
- Cards reviewed → local session count (not from DTO)
- Due remaining → `reviewResult.progress.dueCount`
- Bar → `reviewResult.progress.reviewsTodayCount` / `dailyGoal`
- Next review hint → human-readable version of last card's `nextReviewAt` (optional)

**Do NOT show:** prevBox, nextBox, scheduledAt, reviewedAt, wordId, SRS internals

---

## NAVIGATION FLOW DIAGRAM

```
                    ┌─────────────┐
                    │    HOME     │ ◄──────────────────────┐
                    └──────┬──────┘                        │
                           │                               │
          ┌────────────────┼────────────────┐              │
          ▼                ▼                ▼              │
    ┌──────────┐    ┌──────────┐    ┌──────────────┐       │
    │  REVIEW  │    │  LESSON  │    │  DIALOGUE    │       │
    └────┬─────┘    └────┬─────┘    └──────┬───────┘       │
         │               │                 │               │
         └───────────────┴─────────────────┘               │
                         │                                 │
                         ▼                                 │
                ┌─────────────────┐                        │
                │ SESSION SUMMARY │ ──── "Back to Home" ───┘
                └─────────────────┘

    HOME ──[gear icon]──► SETTINGS  (stack push, not a tab)

    Bottom tabs: HOME · REVIEW · LESSON · DIALOGUE · PROGRESS
```

---

## STITCH PROMPT HINT

> When feeding this to Stitch, prepend with:
> *"Design mobile iOS screens matching the existing visual style: white cards on light gray background, primary blue #2563EB, rounded cards with subtle shadow, full-width blue bottom CTA buttons. Use the wireframes below for layout and field placement. Do not invent extra fields — only render what's labelled."*
