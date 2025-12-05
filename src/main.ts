import {
  game_new,
  game_field_init,
  game_field_add_emoji,
  game_field_move,
} from "./lib"
import { initHelpSystem, setupGestureListeners } from "./help"

const game = game_new()

game_field_init(game, { selector: "#game" })
game_field_add_emoji(game)

// Initialize help system
const { hands, isOpen } = initHelpSystem()
setupGestureListeners(hands)

document.body.addEventListener("keydown", (event) => {
  // Don't handle game gestures when help is open
  if (isOpen()) {
    return
  }

  switch (event.key) {
    case "ArrowUp":
      game_field_move(game, "up")
      break
    case "ArrowDown":
      game_field_move(game, "down")
      break
    case "ArrowLeft":
      game_field_move(game, "left")
      break
    case "ArrowRight":
      game_field_move(game, "right")
      break
  }
})

// Same with swipes
let touchStartX = 0
let touchStartY = 0
let touchEndX = 0
let touchEndY = 0

const gestureZone = document.body as HTMLElement

gestureZone.addEventListener("touchstart", (event) => {
  touchStartX = event.changedTouches[0].screenX
  touchStartY = event.changedTouches[0].screenY
})

gestureZone.addEventListener("touchend", (event) => {
  // Don't handle game gestures when help is open
  if (isOpen()) {
    return
  }

  touchEndX = event.changedTouches[0].screenX
  touchEndY = event.changedTouches[0].screenY

  const dx = touchEndX - touchStartX
  const dy = touchEndY - touchStartY

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0) {
      game_field_move(game, "right")
    } else {
      game_field_move(game, "left")
    }
  } else {
    if (dy > 0) {
      game_field_move(game, "down")
    } else {
      game_field_move(game, "up")
    }
  }
})
