import "./style.css"

const GAME_SIZE = 5
const EMOJI_LIST = [
  // :hand-right:
  "&#x1FAF1;",
  // :hand-left:
  "&#x1FAF2;",
  // :boy:
  "&#x1F468;",
  // :girl:
  "&#x1F469;",
  // :wrench:
  "&#x1F527;",
  // :pan:
  "&#x1F373;",
]

const EMOJI_MAX_PER_LEVEL = new Map([
  [1, 2],
  [2, 4],
  [3, 6],
])

const EMOJI_KEY_TO_SCORE = new Map([
  ["1FAF1", 1],
  ["1FAF2", 1],
  ["1FAF1;1FAF2", 2],
  ["1F468", 3],
  ["1F469", 3],
  ["1F468;1F527", 5],
  ["1F373;1F468", 5],
  ["1F469;1F527", 5],
  ["1F373;1F469", 5],
])

const NOT_MERGE_SET = new Set(["1F527", "1F373"])

const is_skin_tone = (key: string) =>
  key === "1F3FB" ||
  key === "1F3FC" ||
  key === "1F3FD" ||
  key === "1F3FE" ||
  key === "1F3FF"

const is_zwj = (key: string) => key === "200D"

const get_skin_tone_number = (key: string) => {
  switch (key) {
    case "1F3FB":
      return 1
    case "1F3FC":
      return 2
    case "1F3FD":
      return 3
    case "1F3FE":
      return 4
    case "1F3FF":
      return 5
    default:
      return 1
  }
}

function score_to_level(score: number) {
  return Math.min(Math.floor(score / 16) + 1, 3)
}

const EMOJI_MERGE_MAP = new Map([
  ["1FAF1;1FAF2", "1FAF1;1FAF2"],
  ["1F468;1F527", "1F468;1F527"],
  ["1F373;1F468", "1F468;1F373"],
  ["1F469;1F527", "1F469;1F527"],
  ["1F373;1F469", "1F469;1F373"],
])

type Direction = "up" | "down" | "left" | "right"

type CellValue = {
  value: string
  element: HTMLElement
}

type GameField = {
  root: HTMLElement
  best_score: HTMLElement
  score: HTMLElement
}

type Game = {
  is_finished?: boolean
  size: number
  cells: Array<Array<CellValue | null>>
  score: number
  best_score: number
  field?: GameField
}

function game_new(size: number = GAME_SIZE): Game {
  let cells: Game["cells"] = []

  for (let i = 0; i < size; i++) {
    cells[i] = new Array(size).fill(null)
  }

  const best_score = Number.parseInt(localStorage.getItem("best_score") ?? "0")
  document.querySelector("#best-score")!.innerHTML = best_score.toString()

  return {
    size,
    cells,
    score: 0,
    best_score,
  }
}

type PresentationProps = {
  selector: string
}

function game_field_init(game: Game, { selector }: PresentationProps) {
  const field = document.querySelector(selector) as HTMLElement
  const score = document.querySelector("#score") as HTMLElement
  const best_score = document.querySelector("#best-score") as HTMLElement

  if (!field) {
    throw new Error(`Cannot construct game field: ${selector} not found`)
  }

  if (!score) {
    throw new Error(`Cannot construct game field: #score not found`)
  }

  for (let i = 0; i < game.size; i++) {
    const row = document.createElement("tr")
    row.classList.add("field__row")
    field.appendChild(row)

    for (let k = 0; k < game.size; k++) {
      const cell = document.createElement("td")
      cell.classList.add("field__cell")
      row.appendChild(cell)
    }
  }

  game.field = {
    root: field,
    score,
    best_score,
  }
}

function emoji_list_get_random(game: Game) {
  const level = score_to_level(game.score)
  const max = Math.min(EMOJI_MAX_PER_LEVEL.get(level) ?? 1, EMOJI_LIST.length)

  return EMOJI_LIST[Math.floor(Math.random() * max)]
}

function game_cells_get(game: Game, x: number, y: number) {
  return game.cells[y][x]
}

function game_cells_clear(game: Game, x: number, y: number) {
  game.cells[y][x] = null
}

function game_cells_set(game: Game, x: number, y: number, value: CellValue) {
  game.cells[y][x] = value
}

function game_tile_get(game: Game, x: number, y: number) {
  return game_cells_get(game, x, y)?.element ?? null
}

function game_get_offsets(game: Game, x: number, y: number) {
  const offsets = {
    x: 0,
    y: 0,
  }

  if (!game.field) {
    throw new Error("Game is not initialized")
  }

  const style = getComputedStyle(game.field.root)

  const tileSizeProperty = style.getPropertyValue("--tile-size")
  const paddingSizeProperty = style.getPropertyValue("--padding-size")
  const tileSize = tileSizeProperty ? parseInt(tileSizeProperty) : 0
  const paddingSize = paddingSizeProperty ? parseInt(paddingSizeProperty) : 0

  offsets.x = x * (tileSize + paddingSize) + paddingSize
  offsets.y = y * (tileSize + paddingSize) + paddingSize

  return offsets
}

type TileMovement = {
  from: {
    x: number
    y: number
  }
  to: {
    x: number
    y: number
  }
  to_value?: string
  destroy: boolean
}

function game_tile_destroy(game: Game, x: number, y: number) {
  const cell = game_cells_get(game, x, y)

  if (cell) {
    const tile = cell.element.querySelector(".field__tile") as HTMLElement
    tile.classList.add("field__tile-container_destroy")
    tile.addEventListener(
      "transitionend",
      () => {
        cell.element.remove()
      },
      { once: true }
    )
    game_cells_clear(game, x, y)
  }
}

function game_tile_move(game: Game, movement: TileMovement) {
  if (!game.field) {
    throw new Error("Game is not initialized")
  }

  const from_cell = game_cells_get(game, movement.from.x, movement.from.y)
  const to_cell = game_cells_get(game, movement.to.x, movement.to.y)

  if (!from_cell) {
    throw new Error("Cannot move from empty cell")
  }

  from_cell.element.classList.add("field__tile-container_move")

  const { x, y } = game_get_offsets(game, movement.to.x, movement.to.y)

  game_cells_clear(game, movement.from.x, movement.from.y)

  if (!to_cell) {
    game_cells_set(game, movement.to.x, movement.to.y, from_cell)
  }

  from_cell.element.addEventListener(
    "transitionend",
    () => {
      from_cell.element.classList.remove("field__tile-container_move")
      if (movement.destroy) {
        from_cell.element.remove()
      }
      if (movement.to_value) {
        game_cells_set_value(
          game,
          movement.to.x,
          movement.to.y,
          movement.to_value
        )
      }
    },
    { once: true }
  )

  from_cell.element.style.setProperty("transform", `translate(${x}px, ${y}px)`)
}

function game_field_tile_add(game: Game, x: number, y: number, value: string) {
  if (!game.field) {
    throw new Error("Game is not initialized")
  }

  const cell = game_tile_get(game, x, y)

  if (cell) {
    throw new Error("Tile already exists")
  }

  const tile_container = document.createElement("div")
  tile_container.classList.add("field__tile-container")
  const tile = document.createElement("div")
  tile.classList.add("field__tile")

  tile_container.appendChild(tile)

  game_cells_set(game, x, y, {
    value,
    element: tile_container,
  })

  const { x: offsetX, y: offsetY } = game_get_offsets(game, x, y)

  tile_container.style.setProperty(
    "transform",
    `translate(${offsetX}px, ${offsetY}px)`
  )
  tile.innerHTML = value

  tile.addEventListener(
    "animationend",
    () => {
      tile.classList.remove("field__tile_appear")
    },
    { once: true }
  )
  tile.classList.add("field__tile_appear")

  game.field.root.appendChild(tile_container)
}

function game_cells_set_value(game: Game, x: number, y: number, value: string) {
  const cell = game_cells_get(game, x, y)

  if (cell) {
    const tile = cell.element.querySelector(".field__tile") as HTMLElement

    cell.value = value

    if (tile) {
      const value_components = value.split(";")
      const value_color_sum = value_components
        .map((v) => v.replace(/(?:&#x)|;/g, ""))
        .filter((key) => is_skin_tone(key))
        .map((key) => Number.parseInt(key, 16) - 0x1f3fa)
        .reduce((sum, key) => sum + key, 0)
      const color_sub = value_color_sum * 5
      const curr_color = getComputedStyle(tile)
        .getPropertyValue("--base-color")
        .slice(1)

      tile.style.setProperty(
        "--base-color",
        `#${curr_color
          .match(/.{1,2}/g)!
          .map((color) => {
            const color_num = Number.parseInt(color, 16) - color_sub
            return color_num < 0 ? "00" : color_num.toString(16)
          })
          .join("")}`
      )
      if (
        value_components[0] === "&#x1FAF1" &&
        value_components.length === 5 &&
        value_components[1] === value_components[4]
      ) {
        /**
         * @note On Android devices for same tone emoji
         * it will be displayed as handshake emoji
         */
        tile.innerHTML = `🤝${value_components[1]}`
      } else {
        tile.innerHTML = value
      }
      tile.addEventListener("animationend", () => {
        tile.classList.remove("field__tile_appear")
      })
      tile.classList.add("field__tile_appear")
    }
  }
}

function game_field_add_emoji(game: Game) {
  const random_emoji = emoji_list_get_random(game)
  let found = false

  while (!found) {
    const x = Math.floor(Math.random() * game.size)
    const y = Math.floor(Math.random() * game.size)

    if (game_cells_get(game, x, y) === null) {
      game_field_tile_add(game, x, y, random_emoji)
      found = true
    }
  }
}

type MergeValue = {
  key: string
  skin_colors: Record<string, number>
}

function merge_value_new(key: string) {
  const merge_value: MergeValue = {
    key: "",
    skin_colors: {},
  }

  merge_value.key = key
    .split(";")
    .map((key) => key.replace(/(?:&#x)|;/g, ""))
    .filter((key, idx, values) => {
      if (is_skin_tone(key) && idx > 0) {
        merge_value.skin_colors[values[idx - 1]] = get_skin_tone_number(key)
        return null
      } else if (is_zwj(key)) {
        return null
      }

      if (
        idx > 0 &&
        !is_skin_tone(values[idx - 1]) &&
        !is_zwj(values[idx - 1])
      ) {
        merge_value.skin_colors[values[idx - 1]] = NOT_MERGE_SET.has(
          values[idx - 1]
        )
          ? 0
          : 1
      }

      return key
    })
    .filter(Boolean)
    .map((key) => Number.parseInt(key, 16))
    .sort((a, b) => a - b)
    .map((key) => key.toString(16).toUpperCase())
    .join(";")

  return merge_value
}

function merge_value_join(
  merge_value_a: MergeValue,
  merge_value_b: MergeValue
): MergeValue {
  const skin_colors: Record<string, number> = {}

  for (let [key, value] of Object.entries(merge_value_a.skin_colors)) {
    skin_colors[key] = value
  }

  for (let [key, value] of Object.entries(merge_value_b.skin_colors)) {
    if (skin_colors[key]) {
      skin_colors[key] += value
    } else {
      skin_colors[key] = value
    }
  }

  const key = EMOJI_MERGE_MAP.has(merge_value_a.key)
    ? EMOJI_MERGE_MAP.get(merge_value_a.key)!
    : merge_value_a.key

  return {
    key,
    skin_colors,
  }
}

function merge_value_get_key(...keys: string[]) {
  return keys
    .flatMap((key) => key.split(";"))
    .map((key) => Number.parseInt(key, 16))
    .sort((a, b) => a - b)
    .map((key) => key.toString(16))
    .join(";")
    .toUpperCase()
}

function merge_value_get_string(merge_value: MergeValue) {
  return merge_value.key
    .split(";")
    .map((key) => {
      const color = merge_value.skin_colors[key] ?? 0
      return `&#x${key}${
        color > 0 ? `;&#x${(color + 0x1f3fa).toString(16).toUpperCase()}` : ""
      }`
    })
    .join(";&#x200D;")
}

function merge_value_get_merged(a: string, b: string): MergeValue | null {
  const merge_value_a = merge_value_new(a)
  const merge_value_b = merge_value_new(b)

  if (
    merge_value_a.key === merge_value_b.key &&
    !NOT_MERGE_SET.has(merge_value_a.key)
  ) {
    return merge_value_join(merge_value_a, merge_value_b)
  }

  const new_key = merge_value_get_key(merge_value_a.key, merge_value_b.key)

  if (EMOJI_MERGE_MAP.has(new_key)) {
    const skin_colors: Record<string, number> = {}

    for (let [key, value] of Object.entries(merge_value_a.skin_colors)) {
      skin_colors[key] = value
    }

    for (let [key, value] of Object.entries(merge_value_b.skin_colors)) {
      if (skin_colors[key]) {
        skin_colors[key] += value
      } else {
        skin_colors[key] = value
      }
    }

    return {
      key: EMOJI_MERGE_MAP.get(new_key)!,
      skin_colors,
    }
  }

  return null
}

function game_check_for_final(game: Game) {
  for (let i = 0; i < game.size; i++) {
    for (let k = 0; k < game.size; k++) {
      const cell = game_cells_get(game, i, k)

      if (!cell) {
        return false
      }

      if (i + 1 < game.size) {
        const h_cell = game_cells_get(game, i + 1, k)
        const h_merge_value = merge_value_get_merged(
          cell?.value ?? "",
          h_cell?.value ?? ""
        )

        if (h_merge_value) {
          return false
        }
      }

      if (k + 1 < game.size) {
        const v_cell = game_cells_get(game, i, k + 1)
        const v_merge_value = merge_value_get_merged(
          cell?.value ?? "",
          v_cell?.value ?? ""
        )

        if (v_merge_value) {
          return false
        }
      }
    }
  }

  return true
}

function html_emoji_to_unicode(emoji: string) {
  return emoji
    .replace(/&#x/g, "")
    .split(";")
    .filter(Boolean)
    .map((code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .join("")
}

function game_set_finished(game: Game) {
  game.is_finished = true
  const buttons = document.createElement("div")

  buttons.classList.add("field__buttons")

  const replay_button = document.createElement("button")
  replay_button.classList.add("field__replay-button")
  replay_button.innerHTML = "🔄"

  replay_button.addEventListener(
    "click",
    () => {
      location.reload()
    },
    { once: true }
  )

  const share_button = document.createElement("button")
  share_button.classList.add("field__share-button")
  share_button.innerHTML = "📤"

  if (!game.field) {
    throw new Error("Game is not initialized")
  }

  buttons.appendChild(replay_button)
  buttons.appendChild(share_button)

  share_button.addEventListener("click", () => {
    let field_text = ""

    for (let i = 0; i < game.size; i++) {
      for (let k = 0; k < game.size; k++) {
        const cell = game_cells_get(game, i, k)

        if (cell) {
          field_text += html_emoji_to_unicode(cell.value)
        } else {
          field_text += " "
        }
      }

      field_text += "\n"
    }

    const text = `And my field looks like this:\n\n${field_text}`

    if (navigator.share) {
      navigator.share({
        title: `I scored ${game.score} in Emerji`,
        text,
        url: window.location.href,
      })
    } else {
      // Copy text to clipboard
      const textArea = document.createElement("textarea")
      textArea.value =
        `My score is ${game.score}!\n\n` + text + "\n\n" + window.location.href
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
    }
  })

  game.field.root.appendChild(buttons)
}

function game_update_score(game: Game, key: string) {
  if (!game.field) {
    throw new Error("Game is not initialized")
  }

  const score = game.score + (EMOJI_KEY_TO_SCORE.get(key) ?? 0)
  const level = score_to_level(score)

  if (score > game.best_score) {
    localStorage.setItem("best_score", score.toString())
    game.best_score = score
    game.field.best_score.innerHTML = score.toString()
  }

  game.score = score
  game.field.score.innerHTML = score.toString()
  game.field.root.style.setProperty("--level", level.toString())
}

function game_field_move(game: Game, direction: Direction) {
  if (game.is_finished) {
    return
  }

  let some_moved = false

  switch (direction) {
    case "down": {
      for (let i = 0; i < game.size; i++) {
        let merged = false
        let merge_cell: CellValue | null = null
        let merge_cell_coords = {
          x: 0,
          y: 0,
        }

        for (let k = game.size - 1; k >= 0; k--) {
          let cell = game_cells_get(game, i, k)

          if (!cell) {
            continue
          }

          if (!merged && merge_cell) {
            const merge_value = merge_value_get_merged(
              cell.value,
              merge_cell.value
            )

            if (merge_value) {
              if (
                Object.values(merge_value.skin_colors).some(
                  (color) => color > 5
                )
              ) {
                game_update_score(game, merge_value.key)
                game_tile_destroy(game, i, k)
                game_tile_destroy(
                  game,
                  merge_cell_coords.x,
                  merge_cell_coords.y
                )
                merged = true
                continue
              }

              some_moved = true
              merged = true
              game_tile_move(game, {
                from: {
                  x: i,
                  y: k,
                },
                to: merge_cell_coords,
                destroy: true,
              })
              game_cells_set_value(
                game,
                merge_cell_coords.x,
                merge_cell_coords.y,
                merge_value_get_string(merge_value)
              )
              continue
            } else {
              merge_cell = cell
              merge_cell_coords = {
                x: i,
                y: k,
              }
            }
          }

          if (!merge_cell) {
            merge_cell = cell
            merge_cell_coords = {
              x: i,
              y: k,
            }
          }

          let found = false
          let row = k

          while (!found && row < game.size) {
            let f_cell = game_cells_get(game, i, row)
            if (f_cell && cell !== f_cell) {
              found = true
              break
            }
            row++
          }

          if (row - 1 != k) {
            some_moved = true
            game_tile_move(game, {
              from: {
                x: i,
                y: k,
              },
              to: {
                x: i,
                y: row - 1,
              },
              destroy: false,
            })
            if (!merged) {
              merge_cell_coords = {
                x: i,
                y: row - 1,
              }
            }
          }
        }
      }
      break
    }
    case "up": {
      for (let i = 0; i < game.size; i++) {
        let merged = false
        let merge_cell: CellValue | null = null
        let merge_cell_coords = {
          x: 0,
          y: 0,
        }

        for (let k = 0; k < game.size; k++) {
          let cell = game_cells_get(game, i, k)

          if (!cell) {
            continue
          }

          if (!merged && merge_cell) {
            const merge_value = merge_value_get_merged(
              cell.value,
              merge_cell.value
            )

            if (merge_value) {
              if (
                Object.values(merge_value.skin_colors).some(
                  (color) => color > 5
                )
              ) {
                game_update_score(game, merge_value.key)
                game_tile_destroy(game, i, k)
                game_tile_destroy(
                  game,
                  merge_cell_coords.x,
                  merge_cell_coords.y
                )
                merged = true
                continue
              }

              some_moved = true
              merged = true
              game_tile_move(game, {
                from: {
                  x: i,
                  y: k,
                },
                to: merge_cell_coords,
                destroy: true,
              })
              game_cells_set_value(
                game,
                merge_cell_coords.x,
                merge_cell_coords.y,
                merge_value_get_string(merge_value)
              )
              continue
            } else {
              merge_cell = cell
              merge_cell_coords = {
                x: i,
                y: k,
              }
            }
          }

          if (!merge_cell) {
            merge_cell = cell
            merge_cell_coords = {
              x: i,
              y: k,
            }
          }

          let found = false
          let row = k

          while (!found && row >= 0) {
            let f_cell = game_cells_get(game, i, row)
            if (f_cell && cell !== f_cell) {
              found = true
              break
            }
            row--
          }

          if (row + 1 != k) {
            some_moved = true
            game_tile_move(game, {
              from: {
                x: i,
                y: k,
              },
              to: {
                x: i,
                y: row + 1,
              },
              destroy: false,
            })
            if (!merged) {
              merge_cell_coords = {
                x: i,
                y: row + 1,
              }
            }
          }
        }
      }
      break
    }
    case "left": {
      for (let i = 0; i < game.size; i++) {
        let merged = false
        let merge_cell: CellValue | null = null
        let merge_cell_coords = {
          x: 0,
          y: 0,
        }

        for (let k = 0; k < game.size; k++) {
          let cell = game_cells_get(game, k, i)

          if (!cell) {
            continue
          }

          if (!merged && merge_cell) {
            const merge_value = merge_value_get_merged(
              cell.value,
              merge_cell.value
            )

            if (merge_value) {
              if (
                Object.values(merge_value.skin_colors).some(
                  (color) => color > 5
                )
              ) {
                game_update_score(game, merge_value.key)
                game_tile_destroy(game, k, i)
                game_tile_destroy(
                  game,
                  merge_cell_coords.x,
                  merge_cell_coords.y
                )
                merged = true
                continue
              }

              some_moved = true
              merged = true
              game_tile_move(game, {
                from: {
                  x: k,
                  y: i,
                },
                to: merge_cell_coords,
                destroy: true,
              })
              game_cells_set_value(
                game,
                merge_cell_coords.x,
                merge_cell_coords.y,
                merge_value_get_string(merge_value)
              )
              continue
            } else {
              merge_cell = cell
              merge_cell_coords = {
                x: k,
                y: i,
              }
            }
          }

          if (!merge_cell) {
            merge_cell = cell
            merge_cell_coords = {
              x: k,
              y: i,
            }
          }

          let found = false
          let col = k

          while (!found && col >= 0) {
            let f_cell = game_cells_get(game, col, i)
            if (f_cell && cell !== f_cell) {
              found = true
              break
            }
            col--
          }

          if (col + 1 != k) {
            some_moved = true
            game_tile_move(game, {
              from: {
                x: k,
                y: i,
              },
              to: {
                x: col + 1,
                y: i,
              },
              destroy: false,
            })
            if (!merged) {
              merge_cell_coords = {
                x: col + 1,
                y: i,
              }
            }
          }
        }
      }
      break
    }
    case "right": {
      for (let i = 0; i < game.size; i++) {
        let merged = false
        let merge_cell: CellValue | null = null
        let merge_cell_coords = {
          x: 0,
          y: 0,
        }

        for (let k = game.size - 1; k >= 0; k--) {
          let cell = game_cells_get(game, k, i)

          if (!cell) {
            continue
          }

          if (!merged && merge_cell) {
            const merge_value = merge_value_get_merged(
              cell.value,
              merge_cell.value
            )

            if (merge_value) {
              if (
                Object.values(merge_value.skin_colors).some(
                  (color) => color > 5
                )
              ) {
                game_update_score(game, merge_value.key)
                game_tile_destroy(game, k, i)
                game_tile_destroy(
                  game,
                  merge_cell_coords.x,
                  merge_cell_coords.y
                )
                merged = true
                continue
              }

              some_moved = true
              merged = true
              game_tile_move(game, {
                from: {
                  x: k,
                  y: i,
                },
                to: merge_cell_coords,
                destroy: true,
              })
              game_cells_set_value(
                game,
                merge_cell_coords.x,
                merge_cell_coords.y,
                merge_value_get_string(merge_value)
              )
              continue
            } else {
              merge_cell = cell
              merge_cell_coords = {
                x: k,
                y: i,
              }
            }
          }

          if (!merge_cell) {
            merge_cell = cell
            merge_cell_coords = {
              x: k,
              y: i,
            }
          }

          let found = false
          let col = k

          while (!found && col < game.size) {
            let f_cell = game_cells_get(game, col, i)
            if (f_cell && cell !== f_cell) {
              found = true
              break
            }
            col++
          }

          if (col - 1 != k) {
            some_moved = true
            game_tile_move(game, {
              from: {
                x: k,
                y: i,
              },
              to: {
                x: col - 1,
                y: i,
              },
              destroy: false,
            })

            if (!merged) {
              merge_cell_coords = {
                x: col - 1,
                y: i,
              }
            }
          }
        }
      }
      break
    }
  }

  if (some_moved) {
    game_field_add_emoji(game)
    if (game_check_for_final(game)) {
      game_set_finished(game)
    }
  }
}

const game = game_new()

game_field_init(game, { selector: "#game" })
game_field_add_emoji(game)

document.body.addEventListener("keydown", (event) => {
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
