# LiteroQuest — App Plan

## Vision
A mobile game that teaches young children (ages 4–7) how to read, starting with Romanian and built for internationalization from day one. No backend — all progress is stored locally using SQLite on the device.

---

## Tech Stack

| Concern | Library |
|---|---|
| Framework | Expo SDK 52 (Managed Workflow) |
| Language | TypeScript |
| Navigation | React Navigation 6 (Native Stack) |
| Local DB | expo-sqlite v15 (async API) |
| Text-to-Speech | expo-speech (device TTS, works in any language) |
| Haptics | expo-haptics |
| i18n | i18next + react-i18next |

> **Why expo-speech instead of audio files?** The device TTS engine supports Romanian and dozens of other languages natively. This means zero audio assets, smaller bundle, and free i18n for every language we add.

---

## App Flow

```
Launch
  │
  ├─ No profiles in DB → Welcome Screen (language picker)
  │     └─ Create Profile Screen → Home
  │
  └─ Profiles exist → Profile Select Screen
        ├─ Tap existing profile → Home
        └─ Add new → Create Profile → Home
```

---

## Screens

### 1. Welcome Screen
- Shown only on first launch (no profiles in DB yet)
- Animated logo + tagline
- Language picker (Romanian 🇷🇴 / English 🇬🇧)
- "Let's go!" button → Create Profile

### 2. Profile Select
- Grid of existing profiles (emoji avatar + name)
- "Add new" card
- Tap profile → loads it into context → Home

### 3. Create Profile
- Text input for name
- Emoji avatar picker (8 options)
- "Create!" button → saves to DB → Home

### 4. Home Screen
- "Hello, {name}!" greeting with avatar
- 4 large game mode cards with star count:
  - 🔤 **Alfabet** — Learn all letters
  - 🔊 **Sunete** (Phonics) — Recognize starting sounds
  - 📖 **Cuvinte** (Words) — Read and pick words
  - 📊 **Progres** — View achievements
- Language switcher in header

### 5. Alphabet Screen
- 6-column grid of all 31 Romanian letters (33 with Ă, Â, Î, Ș, Ț)
- Learned letters show a green checkmark badge
- Tap → Letter Detail

### 6. Letter Detail Screen
- Full-screen animated letter (large, colorful)
- Example word + emoji underneath
- "Hear it" button → expo-speech speaks the letter name
- "Hear word" button → speaks the example word
- "I learned it! ✓" button → saves progress (1 star) → back

### 7. Phonics Game Screen
- 10 rounds per session
- Each round: big emoji shown (e.g., 🦊) + spoken word via TTS
- Question: "What letter does this word start with?"
- 4 letter buttons (1 correct + 3 distractors)
- Correct → green flash + haptic + next
- Wrong → red shake + haptic + reveal correct
- End: score screen with stars (3★ = 10/10, 2★ = 7+/10, 1★ = 4+/10)
- Saves best star score to DB

### 8. Words Game Screen
- 10 rounds per session
- Each round: big emoji shown (e.g., 🐱)
- 3 word buttons (1 correct + 2 distractors)
- Tapping a word speaks it via TTS
- Same feedback pattern as Phonics
- End: score screen with stars
- Saves best star score to DB

### 9. Progress Screen
- Letters learned: X / 31
- Progress bar
- Phonics best score
- Words best score
- Achievement badges (e.g., "First letter!", "All vowels!", "Perfect phonics!")

---

## Database Schema

```sql
-- Player profiles
CREATE TABLE profiles (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  avatar      TEXT    NOT NULL,   -- emoji string
  language    TEXT    NOT NULL DEFAULT 'ro',
  created_at  INTEGER NOT NULL    -- Unix ms
);

-- Per-lesson progress (one row per profile × lesson)
CREATE TABLE progress (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id   INTEGER NOT NULL,
  lesson_type  TEXT    NOT NULL,  -- 'alphabet' | 'phonics' | 'words'
  lesson_id    TEXT    NOT NULL,  -- e.g. 'letter_A', 'session'
  stars        INTEGER NOT NULL DEFAULT 0,
  attempts     INTEGER NOT NULL DEFAULT 0,
  completed_at INTEGER,           -- Unix ms, NULL until first completion
  FOREIGN KEY (profile_id) REFERENCES profiles(id)
);

-- App-wide key/value settings
CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

---

## Internationalization

- All UI strings live in `src/i18n/locales/{lang}.json`
- i18next initialized at startup; language loaded from DB settings
- `i18n.changeLanguage(lang)` called when user switches language
- TTS calls use `{ language: currentLang === 'ro' ? 'ro-RO' : 'en-US' }`
- Game content (alphabet letters, word lists) is language-specific data in `src/constants/`
- Adding a new language = new locale JSON + new word/alphabet data file

---

## Romanian Alphabet (31 letters)
A Ă Â B C D E F G H I Î J K L M N O P Q R S Ș T Ț U V W X Y Z

Special Romanian letters: **Ă Â Î Ș Ț**

---

## Color Theme

```
Primary:    #FF6B35  (warm orange)
Secondary:  #4ECDC4  (teal)
Accent:     #FFE66D  (yellow)
Success:    #95E77E  (green)
Danger:     #FF6B6B  (red)
Background: #FFF9F0  (warm cream)
```

---

## File Structure

```
/
├── App.tsx                          ← Root entry point
├── app.json                         ← Expo config
├── babel.config.js
├── package.json
├── tsconfig.json
└── src/
    ├── types/
    │   └── index.ts                 ← Shared TypeScript types
    ├── constants/
    │   ├── theme.ts                 ← Colors, spacing, typography
    │   ├── alphabet.ts              ← RO + EN letter data
    │   └── words.ts                 ← RO + EN word lists
    ├── i18n/
    │   ├── index.ts                 ← i18next setup
    │   └── locales/
    │       ├── ro.json
    │       └── en.json
    ├── database/
    │   ├── index.ts                 ← SQLite init + getDatabase()
    │   └── queries.ts               ← All CRUD functions
    ├── context/
    │   └── AppContext.tsx           ← Global state (profile, language, DB)
    ├── hooks/
    │   ├── useSound.ts              ← expo-speech wrapper
    │   └── useProgress.ts           ← Progress read/write helper
    ├── components/
    │   ├── common/
    │   │   ├── Button.tsx
    │   │   └── StarRating.tsx
    │   └── game/
    │       └── FeedbackOverlay.tsx
    ├── navigation/
    │   ├── types.ts                 ← RootStackParamList
    │   └── RootNavigator.tsx
    └── screens/
        ├── Welcome/
        │   └── WelcomeScreen.tsx
        ├── Profile/
        │   ├── ProfileSelectScreen.tsx
        │   └── CreateProfileScreen.tsx
        ├── Home/
        │   └── HomeScreen.tsx
        ├── Alphabet/
        │   ├── AlphabetScreen.tsx
        │   └── LetterDetailScreen.tsx
        ├── Phonics/
        │   └── PhonicsGameScreen.tsx
        ├── Words/
        │   └── WordsGameScreen.tsx
        └── Progress/
            └── ProgressScreen.tsx
```

---

## Getting Started

```bash
npm install
npx expo start
```

Press `i` for iOS simulator, `a` for Android emulator, or scan the QR code with Expo Go.

---

## Future Roadmap
- Sentences game (arrange words into a sentence)
- More languages (FR, DE, ES, HU)
- Parental dashboard
- Audio recording — child reads aloud, gets feedback
- Adaptive difficulty based on progress history
