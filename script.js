class BlinkTacToe {
  constructor() {
    this.emojiCategories = {
      animals: {
        name: "Animals",
        emojis: ["🐶", "🐱", "🐵", "🐰", "🦊", "🐻", "🐼", "🐨", "🦁", "🐸", "🐯", "🐷"],
        color: "#4ade80",
        bgColor: "#dcfce7",
      },
      food: {
        name: "Food",
        emojis: ["🍕", "🍟", "🍔", "🍩", "🍪", "🍰", "🧁", "🍭", "🍎", "🍌", "🍓", "🥑"],
        color: "#f59e0b",
        bgColor: "#fef3c7",
      },
      sports: {
        name: "Sports",
        emojis: ["⚽", "🏀", "🏈", "🎾", "🏐", "🏓", "🥎", "🏸", "🎱", "🏒", "🏑", "🥍"],
        color: "#ef4444",
        bgColor: "#fee2e2",
      },
      nature: {
        name: "Nature",
        emojis: ["🌸", "🌳", "🌊", "⭐", "🌙", "☀️", "🌈", "🍀", "🌺", "🌻", "🌿", "🌵"],
        color: "#10b981",
        bgColor: "#d1fae5",
      },
      space: {
        name: "Space",
        emojis: ["🚀", "🛸", "🌟", "⭐", "🌙", "🪐", "🌌", "☄️", "🛰️", "👽", "🌍", "🌕"],
        color: "#8b5cf6",
        bgColor: "#ede9fe",
      },
      tech: {
        name: "Tech",
        emojis: ["💻", "📱", "🎮", "🖥️", "⌚", "🎧", "📷", "🔋", "💾", "🖱️", "⌨️", "🖨️"],
        color: "#3b82f6",
        bgColor: "#dbeafe",
      },
      faces: {
        name: "Faces",
        emojis: ["😀", "😎", "🤔", "😍", "🤩", "😂", "🥳", "😊", "🙃", "😋", "🤗", "😇"],
        color: "#ec4899",
        bgColor: "#fce7f3",
      },
      objects: {
        name: "Objects",
        emojis: ["🎯", "🎪", "🎨", "🎭", "🎪", "🎲", "🎸", "🎺", "🎻", "🎹", "🎤", "🎬"],
        color: "#6366f1",
        bgColor: "#e0e7ff",
      },
    }

    this.gameState = {
      currentPlayer: 1,
      player1Category: null,
      player2Category: null,
      board: Array(9).fill(null),
      player1Emojis: [],
      player2Emojis: [],
      player1Positions: [],
      player2Positions: [],
      gameActive: false,
      winner: null,
      lastRemovedPosition: null,
      animatingCells: new Set(),
      gameTime: 0,
      turnTime: 0,
      totalMoves: 0,
      emojiOrder: 0,
      gameHistory: [],
      scores: { player1: 0, player2: 0 },
      soundEnabled: true,
      showStats: false,
    }

    this.gameTimerRef = null
    this.turnTimerRef = null
    this.audioContext = null

    this.initializeAudio()
    this.initializeEventListeners()
    this.showCategorySelection()
  }

  initializeAudio() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
    } catch (error) {
      console.log("Audio context not supported")
    }
  }

  playSound(type) {
    if (!this.gameState.soundEnabled || !this.audioContext) return

    try {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      const frequencies = {
        place: 440,
        vanish: 220,
        win: 660,
        invalid: 150,
        tick: 800,
        select: 520,
      }

      oscillator.frequency.setValueAtTime(frequencies[type], this.audioContext.currentTime)
      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3)

      oscillator.start(this.audioContext.currentTime)
      oscillator.stop(this.audioContext.currentTime + 0.3)
    } catch (error) {
      console.log("Sound playback failed")
    }
  }

  initializeEventListeners() {
    document.querySelectorAll(".category").forEach((category) => {
      category.addEventListener("click", (e) => this.selectCategory(e))
    })

    document.getElementById("startGame").addEventListener("click", () => this.startGame())
    document.getElementById("newGame").addEventListener("click", () => this.newGame())
    document.getElementById("resetGame").addEventListener("click", () => this.resetGame())
    document.getElementById("playAgain").addEventListener("click", () => this.newGame())
    document.getElementById("newCategories").addEventListener("click", () => this.resetGame())

    document.querySelectorAll(".cell").forEach((cell) => {
      cell.addEventListener("click", (e) => this.makeMove(e))
    })

    document.getElementById("helpBtn").addEventListener("click", () => this.showHelp())
    document.getElementById("closeHelp").addEventListener("click", () => this.hideHelp())
    document.getElementById("helpModal").addEventListener("click", (e) => {
      if (e.target.id === "helpModal") this.hideHelp()
    })

    document.getElementById("soundToggle").addEventListener("click", () => this.toggleSound())

    document.getElementById("statsToggle").addEventListener("click", () => this.toggleStats())
  }

  selectCategory(e) {
    const category = e.currentTarget
    const categoryName = category.dataset.category
    const player = Number.parseInt(category.dataset.player)

    const otherPlayer = player === 1 ? 2 : 1
    const otherPlayerCategory = player === 1 ? this.gameState.player2Category : this.gameState.player1Category

    if (otherPlayerCategory === categoryName) {
      this.showMessage("This category is already selected by the other player!")
      return
    }

    document.querySelectorAll(`.category[data-player="${player}"]`).forEach((cat) => {
      cat.classList.remove("selected")
    })

    document.querySelectorAll(".category").forEach((cat) => {
      cat.classList.remove("disabled")
    })

    category.classList.add("selected")

    if (player === 1) {
      this.gameState.player1Category = categoryName
      document.getElementById("player1Selected").textContent = `Selected: ${this.emojiCategories[categoryName].name}`
    } else {
      this.gameState.player2Category = categoryName
      document.getElementById("player2Selected").textContent = `Selected: ${this.emojiCategories[categoryName].name}`
    }

    document.querySelectorAll(`.category[data-category="${categoryName}"]`).forEach((cat) => {
      if (Number.parseInt(cat.dataset.player) !== player) {
        cat.classList.add("disabled")
      }
    })

    this.playSound("select")

    if (
      this.gameState.player1Category &&
      this.gameState.player2Category &&
      this.gameState.player1Category !== this.gameState.player2Category
    ) {
      document.getElementById("startGame").disabled = false
    }
  }

  startGame() {
    this.gameState.gameActive = true
    this.gameState.gameTime = 0
    this.gameState.turnTime = 0
    this.gameState.totalMoves = 0
    this.gameState.emojiOrder = 0
    this.gameState.gameHistory = []

    this.showGameScreen()
    this.updateGameDisplay()
    this.generateNextEmoji()
    this.startTimers()
  }

  startTimers() {
    this.gameTimerRef = setInterval(() => {
      this.gameState.gameTime++
      this.updateTimerDisplays()
    }, 1000)

    this.turnTimerRef = setInterval(() => {
      this.gameState.turnTime++
      this.updateTimerDisplays()
      this.updateProgressBar()
    }, 1000)
  }

  stopTimers() {
    if (this.gameTimerRef) {
      clearInterval(this.gameTimerRef)
      this.gameTimerRef = null
    }
    if (this.turnTimerRef) {
      clearInterval(this.turnTimerRef)
      this.turnTimerRef = null
    }
  }

  updateTimerDisplays() {
    const gameTimeElement = document.getElementById("gameTime")
    const turnTimeElement = document.getElementById("turnTime")
    const detailedGameTimeElement = document.getElementById("detailedGameTime")
    const detailedTurnTimeElement = document.getElementById("detailedTurnTime")

    const gameTimeFormatted = this.formatTime(this.gameState.gameTime)
    const turnTimeFormatted = this.formatTime(this.gameState.turnTime)

    if (gameTimeElement) gameTimeElement.textContent = gameTimeFormatted
    if (turnTimeElement) turnTimeElement.textContent = turnTimeFormatted
    if (detailedGameTimeElement) detailedGameTimeElement.textContent = gameTimeFormatted
    if (detailedTurnTimeElement) detailedTurnTimeElement.textContent = turnTimeFormatted
  }

  updateProgressBar() {
    const progressFill = document.getElementById("progressFill")
    if (progressFill) {
      const progress = (this.gameState.turnTime % 30) * (100 / 30)
      progressFill.style.width = `${progress}%`
    }
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  newGame() {
    this.stopTimers()

    this.gameState.board = Array(9).fill(null)
    this.gameState.player1Emojis = []
    this.gameState.player2Emojis = []
    this.gameState.player1Positions = []
    this.gameState.player2Positions = []
    this.gameState.currentPlayer = 1
    this.gameState.winner = null
    this.gameState.lastRemovedPosition = null
    this.gameState.animatingCells = new Set()
    this.gameState.gameActive = true
    this.gameState.gameTime = 0
    this.gameState.turnTime = 0
    this.gameState.totalMoves = 0
    this.gameState.emojiOrder = 0
    this.gameState.gameHistory = []

    document.querySelectorAll(".cell").forEach((cell) => {
      cell.textContent = ""
      cell.classList.remove("winning", "disabled", "animating", "blocked")
    })

    this.showGameScreen()
    this.updateGameDisplay()
    this.generateNextEmoji()
    this.startTimers()
  }

  resetGame() {
    this.stopTimers()

    this.gameState = {
      currentPlayer: 1,
      player1Category: null,
      player2Category: null,
      board: Array(9).fill(null),
      player1Emojis: [],
      player2Emojis: [],
      player1Positions: [],
      player2Positions: [],
      gameActive: false,
      winner: null,
      lastRemovedPosition: null,
      animatingCells: new Set(),
      gameTime: 0,
      turnTime: 0,
      totalMoves: 0,
      emojiOrder: 0,
      gameHistory: [],
      scores: this.gameState.scores, 
      soundEnabled: this.gameState.soundEnabled,
      showStats: this.gameState.showStats,
    }

    document.querySelectorAll(".category").forEach((cat) => {
      cat.classList.remove("selected", "disabled")
    })
    document.getElementById("player1Selected").textContent = "Select a category"
    document.getElementById("player2Selected").textContent = "Select a category"
    document.getElementById("startGame").disabled = true
    document.querySelectorAll(".cell").forEach((cell) => {
      cell.textContent = ""
      cell.classList.remove("winning", "disabled", "animating", "blocked")
    })

    this.showCategorySelection()
  }

  generateNextEmoji() {
    const currentCategory =
      this.gameState.currentPlayer === 1 ? this.gameState.player1Category : this.gameState.player2Category

    const emojis = this.emojiCategories[currentCategory].emojis
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)]

    document.getElementById("nextEmoji").textContent = randomEmoji

    const categoryName = this.emojiCategories[currentCategory].name
    document.getElementById("nextEmojiInfo").textContent = `Get ready for: ${randomEmoji} from ${categoryName}`

    return randomEmoji
  }

  makeMove(e) {
    if (!this.gameState.gameActive) return

    const cellIndex = Number.parseInt(e.target.dataset.index)
    const cell = e.target

    if (this.gameState.board[cellIndex] !== null) return

    const currentPlayer = this.gameState.currentPlayer
    const playerEmojis = currentPlayer === 1 ? this.gameState.player1Emojis : this.gameState.player2Emojis
    const playerPositions = currentPlayer === 1 ? this.gameState.player1Positions : this.gameState.player2Positions

    if (playerEmojis.length === 3 && this.gameState.lastRemovedPosition === cellIndex) {
      this.playSound("invalid")
      this.showMessage("You can't place your 4th emoji where your oldest just disappeared!")

      cell.classList.add("blocked")
      this.gameState.animatingCells.add(cellIndex)
      setTimeout(() => {
        cell.classList.remove("blocked")
        this.gameState.animatingCells.delete(cellIndex)
      }, 500)
      return
    }

    const emoji = document.getElementById("nextEmoji").textContent
    const timestamp = Date.now()
    const order = this.gameState.emojiOrder

    let removedPosition = null
    if (playerEmojis.length === 3) {
      const oldestPosition = playerPositions[0]
      const oldestCell = document.querySelector(`[data-index="${oldestPosition}"]`)

      oldestCell.classList.add("animating")
      this.gameState.animatingCells.add(oldestPosition)

      setTimeout(() => {
        oldestCell.textContent = ""
        oldestCell.classList.remove("animating")
        this.gameState.animatingCells.delete(oldestPosition)
        this.gameState.board[oldestPosition] = null
      }, 300)

      this.playSound("vanish")
      removedPosition = oldestPosition

      playerEmojis.shift()
      playerPositions.shift()
    }

    setTimeout(
      () => {
        cell.textContent = emoji
        cell.classList.add("animating")
        this.gameState.animatingCells.add(cellIndex)

        setTimeout(() => {
          cell.classList.remove("animating")
          this.gameState.animatingCells.delete(cellIndex)
        }, 300)

        this.gameState.board[cellIndex] = { emoji, player: currentPlayer, timestamp, order }
        playerEmojis.push(emoji)
        playerPositions.push(cellIndex)
        this.gameState.lastRemovedPosition = removedPosition
        this.gameState.totalMoves++
        this.gameState.emojiOrder++
        this.gameState.turnTime = 0

        this.gameState.gameHistory.push({
          move: this.gameState.totalMoves,
          player: currentPlayer,
          emoji,
          position: cellIndex,
        })

        this.playSound("place")

        if (this.checkWin()) {
          this.gameState.winner = currentPlayer
          this.gameState.gameActive = false
          this.gameState.scores[`player${currentPlayer}`]++
          this.stopTimers()
          this.playSound("win")
          setTimeout(() => this.showWinScreen(), 1000)
          return
        }

        this.gameState.currentPlayer = currentPlayer === 1 ? 2 : 1
        this.updateGameDisplay()
        this.generateNextEmoji()
      },
      playerEmojis.length === 3 ? 300 : 0,
    )
  }

  checkWin() {
    const winPatterns = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8], 
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8], 
      [0, 4, 8],
      [2, 4, 6], 
    ]

    for (const pattern of winPatterns) {
      const [a, b, c] = pattern
      const cellA = this.gameState.board[a]
      const cellB = this.gameState.board[b]
      const cellC = this.gameState.board[c]

      if (cellA && cellB && cellC && cellA.player === cellB.player && cellB.player === cellC.player) {
        pattern.forEach((index) => {
          document.querySelector(`[data-index="${index}"]`).classList.add("winning")
        })

        return true
      }
    }

    return false
  }

  updateGameDisplay() {
    document.getElementById("currentTurn").textContent = `Player ${this.gameState.currentPlayer}'s turn`

    const player1Info = document.getElementById("player1Info")
    const player2Info = document.getElementById("player2Info")
    const player1Turn = document.getElementById("player1Turn")
    const player2Turn = document.getElementById("player2Turn")

    player1Info.classList.remove("active")
    player2Info.classList.remove("active")
    player1Turn.classList.add("hidden")
    player2Turn.classList.add("hidden")

    if (this.gameState.currentPlayer === 1) {
      player1Info.classList.add("active")
      player1Turn.classList.remove("hidden")
    } else {
      player2Info.classList.add("active")
      player2Turn.classList.remove("hidden")
    }

    if (this.gameState.player1Category) {
      const category1 = this.emojiCategories[this.gameState.player1Category]
      document.getElementById("player1Category").textContent = category1.name
      document.getElementById("player1Preview").innerHTML = category1.emojis
        .slice(0, 6)
        .map((emoji) => `<span class="preview-emoji">${emoji}</span>`)
        .join("")
    }

    if (this.gameState.player2Category) {
      const category2 = this.emojiCategories[this.gameState.player2Category]
      document.getElementById("player2Category").textContent = category2.name
      document.getElementById("player2Preview").innerHTML = category2.emojis
        .slice(0, 6)
        .map((emoji) => `<span class="preview-emoji">${emoji}</span>`)
        .join("")
    }

    document.getElementById("player1Count").textContent = `Active: ${this.gameState.player1Emojis.length}/3`
    document.getElementById("player2Count").textContent = `Active: ${this.gameState.player2Emojis.length}/3`

    this.updateEmojiLists()

    const blockedPosition = document.getElementById("blockedPosition")
    if (this.gameState.lastRemovedPosition !== null) {
      blockedPosition.textContent = `⚠️ Position ${this.gameState.lastRemovedPosition + 1} is blocked this turn`
      blockedPosition.classList.remove("hidden")
    } else {
      blockedPosition.classList.add("hidden")
    }

    document.getElementById("moveCount").textContent = this.gameState.totalMoves

    document.getElementById("player1Score").textContent =
      `Player 1: ${this.gameState.scores.player1} ${this.gameState.scores.player1 === 1 ? "win" : "wins"}`
    document.getElementById("player2Score").textContent =
      `Player 2: ${this.gameState.scores.player2} ${this.gameState.scores.player2 === 1 ? "win" : "wins"}`

    if (this.gameState.showStats) {
      this.updateDetailedStats()
    }
  }

  updateEmojiLists() {
    const player1List = document.getElementById("player1List")
    const player2List = document.getElementById("player2List")

    player1List.innerHTML = this.gameState.player1Emojis
      .map((emoji, index) => {
        const position = this.gameState.player1Positions[index]
        const isNext = index === 0 && this.gameState.player1Emojis.length === 3
        return `<div class="emoji-item">
        ${emoji} at position ${position + 1}
        ${isNext ? '<span class="vanish-warning">(next to vanish)</span>' : ""}
      </div>`
      })
      .join("")

    player2List.innerHTML = this.gameState.player2Emojis
      .map((emoji, index) => {
        const position = this.gameState.player2Positions[index]
        const isNext = index === 0 && this.gameState.player2Emojis.length === 3
        return `<div class="emoji-item">
        ${emoji} at position ${position + 1}
        ${isNext ? '<span class="vanish-warning">(next to vanish)</span>' : ""}
      </div>`
      })
      .join("")
  }

  updateDetailedStats() {
    document.getElementById("detailedMoveCount").textContent = this.gameState.totalMoves
    document.getElementById("boardEmojiCount").textContent = this.gameState.board.filter((cell) => cell !== null).length
    document.getElementById("p1ActiveCount").textContent = this.gameState.player1Emojis.length
    document.getElementById("p2ActiveCount").textContent = this.gameState.player2Emojis.length

    const blockedWarning = document.getElementById("blockedWarning")
    const blockedPos = document.getElementById("blockedPos")
    if (this.gameState.lastRemovedPosition !== null) {
      blockedPos.textContent = this.gameState.lastRemovedPosition + 1
      blockedWarning.classList.remove("hidden")
    } else {
      blockedWarning.classList.add("hidden")
    }

    const recentMovesList = document.getElementById("recentMovesList")
    const recentMoves = this.gameState.gameHistory.slice(-3)
    recentMovesList.innerHTML = recentMoves
      .map(
        (move) =>
          `<div class="move-item">Move ${move.move}: P${move.player} placed ${move.emoji} at ${move.position + 1}</div>`,
      )
      .join("")
  }

  toggleSound() {
    this.gameState.soundEnabled = !this.gameState.soundEnabled
    const soundButton = document.getElementById("soundToggle")
    soundButton.textContent = this.gameState.soundEnabled ? "🔊 Sound" : "🔇 Sound"
    this.playSound("select")
  }

  toggleStats() {
    this.gameState.showStats = !this.gameState.showStats
    const statsButton = document.getElementById("statsToggle")
    const extendedStats = document.getElementById("extendedStats")

    statsButton.textContent = this.gameState.showStats ? "Hide Stats" : "Show Stats"

    if (this.gameState.showStats) {
      extendedStats.classList.remove("hidden")
      this.updateDetailedStats()
    } else {
      extendedStats.classList.add("hidden")
    }
  }

  showMessage(message) {
    alert(message)
  }

  showCategorySelection() {
    document.getElementById("categorySelection").classList.remove("hidden")
    document.getElementById("gameScreen").classList.add("hidden")
    document.getElementById("winScreen").classList.add("hidden")
    document.getElementById("scoreDisplay").classList.add("hidden")
    document.getElementById("gameStats").classList.add("hidden")
  }

  showGameScreen() {
    document.getElementById("categorySelection").classList.add("hidden")
    document.getElementById("gameScreen").classList.remove("hidden")
    document.getElementById("winScreen").classList.add("hidden")
    document.getElementById("scoreDisplay").classList.remove("hidden")
    document.getElementById("gameStats").classList.remove("hidden")
  }

  showWinScreen() {
    const winnerText = document.getElementById("winnerText")
    const winningLine = document.getElementById("winningLine")

    winnerText.textContent = `Player ${this.gameState.winner} Wins!`

    const winnerEmojis = this.gameState.winner === 1 ? this.gameState.player1Emojis : this.gameState.player2Emojis
    winningLine.textContent = `Winning line: ${winnerEmojis.slice(-3).join(" ")}`

    document.getElementById("categorySelection").classList.add("hidden")
    document.getElementById("gameScreen").classList.add("hidden")
    document.getElementById("winScreen").classList.remove("hidden")
  }

  showHelp() {
    document.getElementById("helpModal").classList.remove("hidden")
  }

  hideHelp() {
    document.getElementById("helpModal").classList.add("hidden")
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new BlinkTacToe()
})
