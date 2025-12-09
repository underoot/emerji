# Emerji 🤝

> An emoji-based puzzle game where you merge emojis to create new combinations and score points.

Emerji is a 2048-style puzzle game played with emojis on a 5x5 grid. Merge matching emojis to create new combinations, build workers and chefs, and achieve the highest score possible!

## How to Play

### Controls

**Desktop:**
- Use arrow keys (↑ ↓ ← →) to move all emojis in that direction

**Mobile:**
- Swipe in any direction to move all emojis

### Game Rules

The game features several emoji combinations:

- 🫱 (Right Hand) + 🫲 (Left Hand) = 👨/👩 (Person) - **2 points**
- 👨/👩 (Person) + 🔧 (Wrench) = 👨‍🔧/👩‍🔧 (Mechanic) - **5 points**
- 👨/👩 (Person) + 🍳 (Pan) = 👨‍🍳/👩‍🍳 (Chef) - **5 points**

When you move, all emojis slide in the chosen direction. Matching emojis merge together, and a new random emoji appears on the board after each move.

## Development

### Prerequisites

- Node.js (with npm)

### Installation

```bash
npm install
```

### Running Locally

```bash
npm run dev
```

The game will be available at `http://localhost:5173` (or another port if 5173 is busy).