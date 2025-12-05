const HELP_SHOWN_KEY = "help_shown"

type HelpSystemElements = {
  button: HTMLElement
  overlay: HTMLElement
  hands: HTMLElement
  isOpen: () => boolean
  resetHands: () => void
}

function createHelpButton(): HTMLElement {
  const button = document.createElement("button")
  button.classList.add("help-button")
  button.innerHTML = "?"
  button.setAttribute("aria-label", "Help")
  return button
}

function createHelpOverlay(): HTMLElement {
  const overlay = document.createElement("div")
  overlay.classList.add("help-overlay")

  const popup = document.createElement("div")
  popup.classList.add("help-popup")

  const closeButton = document.createElement("button")
  closeButton.classList.add("help-popup__close")
  closeButton.innerHTML = "✕"
  closeButton.setAttribute("aria-label", "Close")

  const demo = document.createElement("div")
  demo.classList.add("help-popup__demo")

  const hands = document.createElement("div")
  hands.classList.add("help-popup__hands")

  const handLeft = document.createElement("div")
  handLeft.classList.add("help-popup__hand")
  handLeft.innerHTML = "&#x1FAF2;"

  const handRight = document.createElement("div")
  handRight.classList.add("help-popup__hand")
  handRight.innerHTML = "&#x1FAF1;"

  hands.appendChild(handLeft)
  hands.appendChild(handRight)
  demo.appendChild(hands)

  const title = document.createElement("h2")
  title.classList.add("help-popup__title")
  title.textContent = "Emerji"

  const description = document.createElement("p")
  description.classList.add("help-popup__description")
  description.textContent = "Merge emojis to create new combinations and score points!"

  const instructionsTitle = document.createElement("h3")
  instructionsTitle.classList.add("help-popup__instructions-title")
  instructionsTitle.textContent = "How to Play"

  const instructions = document.createElement("ul")
  instructions.classList.add("help-popup__instructions")

  // Mobile instruction
  const mobileInstruction = document.createElement("li")
  mobileInstruction.classList.add("help-popup__instruction")

  const mobileIcon = document.createElement("div")
  mobileIcon.classList.add("help-popup__icon")
  // Hand swipe gesture SVG icon with directional arrows
  mobileIcon.innerHTML = `
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 16L8 10C8 8.89543 8.89543 8 10 8C11.1046 8 12 8.89543 12 10L12 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M12 12L12 8C12 6.89543 12.8954 6 14 6C15.1046 6 16 6.89543 16 8L16 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M16 12L16 9C16 7.89543 16.8954 7 18 7C19.1046 7 20 7.89543 20 9L20 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M20 13L20 11C20 9.89543 20.8954 9 22 9C23.1046 9 24 9.89543 24 11L24 18C24 22 21 25 17 25L12 25C9 25 7 23 7 20L7 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M6 16L2 16M2 16L4 14M2 16L4 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M26 16L30 16M30 16L28 14M30 16L28 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M14 6L14 2M14 2L12 4M14 2L16 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M14 26L14 30M14 30L12 28M14 30L16 28" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `

  const mobileText = document.createElement("span")
  mobileText.textContent = "On mobile: use swipe gestures to move emoji icons"

  mobileInstruction.appendChild(mobileIcon)
  mobileInstruction.appendChild(mobileText)

  // Desktop instruction
  const desktopInstruction = document.createElement("li")
  desktopInstruction.classList.add("help-popup__instruction")

  const desktopIcon = document.createElement("div")
  desktopIcon.classList.add("help-popup__icon")
  // Arrow keys SVG icon
  desktopIcon.innerHTML = `
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="13" y="2" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"/>
      <path d="M16 4L16 6M14.5 5L17.5 5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
      <rect x="2" y="13" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"/>
      <path d="M4 16L6 16M5 14.5L5 17.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
      <rect x="13" y="13" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"/>
      <path d="M16 15L16 17M14.5 16L17.5 16" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
      <rect x="24" y="13" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"/>
      <path d="M26 16L28 16M27 14.5L27 17.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
    </svg>
  `

  const desktopText = document.createElement("span")
  desktopText.textContent = "On desktop: use arrow keys to move emoji icons"

  desktopInstruction.appendChild(desktopIcon)
  desktopInstruction.appendChild(desktopText)

  instructions.appendChild(mobileInstruction)
  instructions.appendChild(desktopInstruction)

  popup.appendChild(closeButton)
  popup.appendChild(demo)
  popup.appendChild(title)
  popup.appendChild(description)
  popup.appendChild(instructionsTitle)
  popup.appendChild(instructions)

  overlay.appendChild(popup)

  return overlay
}

export function initHelpSystem(): HelpSystemElements {
  const button = createHelpButton()
  const overlay = createHelpOverlay()
  const hands = overlay.querySelector(".help-popup__hands") as HTMLElement

  document.body.appendChild(button)
  document.body.appendChild(overlay)

  const closeButton = overlay.querySelector(".help-popup__close") as HTMLElement

  let isHelpOpen = false

  const resetHands = () => {
    hands.classList.remove("collapsed")
    hands.classList.remove("merged")
    hands.classList.remove("permanently-merged")
  }

  const openHelp = () => {
    overlay.classList.add("active")
    isHelpOpen = true
    resetHands()
    startHandsAnimation(hands)
  }

  const closeHelp = () => {
    overlay.classList.remove("active")
    isHelpOpen = false
    stopHandsAnimation()
  }

  button.addEventListener("click", openHelp)
  closeButton.addEventListener("click", closeHelp)

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closeHelp()
    }
  })

  // Check if help should be shown automatically
  const hasShownHelp = localStorage.getItem(HELP_SHOWN_KEY)

  if (!hasShownHelp) {
    setTimeout(() => {
      openHelp()
      localStorage.setItem(HELP_SHOWN_KEY, "true")
    }, 500)
  }

  return {
    button,
    overlay,
    hands,
    isOpen: () => isHelpOpen,
    resetHands,
  }
}

let handsAnimationInterval: number | null = null

function startHandsAnimation(hands: HTMLElement) {
  stopHandsAnimation()

  let isCollapsed = false

  const animate = () => {
    if (isCollapsed) {
      hands.classList.remove("collapsed")
    } else {
      hands.classList.add("collapsed")
    }
    isCollapsed = !isCollapsed
  }

  // Start animation immediately
  animate()

  // Continue animation every 1 second
  handsAnimationInterval = window.setInterval(animate, 1000)
}

function stopHandsAnimation() {
  if (handsAnimationInterval !== null) {
    clearInterval(handsAnimationInterval)
    handsAnimationInterval = null
  }
}

// Listen to keyboard and swipe events to trigger collapse animation
export function setupGestureListeners(hands: HTMLElement) {
  let touchStartTime = 0
  const GESTURE_THRESHOLD = 50

  const triggerHandsCollapse = () => {
    // Add collapsed class to move hands together
    hands.classList.add("collapsed")

    // After hands come together, show handshake
    setTimeout(() => {
      hands.classList.add("merged")
    }, 250) // Half of the animation time

    // Make it permanent after animation completes
    setTimeout(() => {
      hands.classList.add("permanently-merged")
    }, 750)
  }

  document.body.addEventListener("keydown", (event) => {
    if (
      event.key === "ArrowUp" ||
      event.key === "ArrowDown" ||
      event.key === "ArrowLeft" ||
      event.key === "ArrowRight"
    ) {
      triggerHandsCollapse()
    }
  })

  let touchStartX = 0
  let touchStartY = 0

  document.body.addEventListener("touchstart", (event) => {
    touchStartTime = Date.now()
    touchStartX = event.changedTouches[0].screenX
    touchStartY = event.changedTouches[0].screenY
  })

  document.body.addEventListener("touchend", (event) => {
    const touchEndX = event.changedTouches[0].screenX
    const touchEndY = event.changedTouches[0].screenY
    const timeDiff = Date.now() - touchStartTime

    const dx = touchEndX - touchStartX
    const dy = touchEndY - touchStartY

    if (
      timeDiff < 300 &&
      (Math.abs(dx) > GESTURE_THRESHOLD || Math.abs(dy) > GESTURE_THRESHOLD)
    ) {
      triggerHandsCollapse()
    }
  })
}
