const COLORS = [0xff4757, 0x1e90ff, 0x2ed573];
const PLAYER_X = 80;
const PLAYER_Y = 320;
const PLAYER_SIZE = 40;
const OBSTACLE_WIDTH = 40;
const OBSTACLE_HEIGHT = 120;
const PLAYER_SPEED = 200;

let player;
let obstacles;
let currentColorIndex = 0;
let score = 0;
let scoreText;
let gameOver = false;
let gameStarted = false;
let startUI = [];
let gameOverUI = [];
let highScore = localStorage.getItem("highScore")
  ? parseInt(localStorage.getItem("highScore"))
  : 0;
let tutorialMode = true;
let tutorialObjects = [];
let isNewHighScore = false;
let sfx = {};

const config = {
  type: Phaser.AUTO,
  width: 360,
  height: 640,
  backgroundColor: "#000000",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: { preload, create, update },
};

new Phaser.Game(config);

function preload() {}

function create() {
  score = 0;
  gameOver = false;
  gameStarted = false;
  currentColorIndex = 0;
  startUI = [];
  this.input.removeAllListeners();
  createStartUI.call(this);

  player = this.add.rectangle(
    PLAYER_X,
    PLAYER_Y,
    PLAYER_SIZE,
    PLAYER_SIZE,
    COLORS[currentColorIndex]
  );
  this.physics.add.existing(player);

  player.body.setVelocityX(0);
  player.body.setImmovable(true);
  player.body.allowGravity = false;
  player.setVisible(false);

  this.cameras.main.startFollow(player, false, 1, 1, -120, 0);
  this.cameras.main.setBounds(0, 0, 100000, 640);

  this.tweens.add({
    targets: player,
    scale: 1.1,
    duration: 300,
    yoyo: true,
    repeat: -1,
  });

  obstacles = this.physics.add.group();

  this.time.addEvent({
    delay: 900,
    loop: true,
    callback: () => spawnObstacle.call(this),
  });

  scoreText = this.add.text(20, 20, "Score: 0", {
    fontSize: "22px",
    color: "#ffffff",
  });
  scoreText.setVisible(false);
  scoreText.setScrollFactor(0);

  sfx.start = this.sound.add("gameStart", {
    volume: 0.6,
  });

  sfx.gameOver = this.sound.add("gameOver", {
    volume: 0.7,
  });

  this.input.on("pointerdown", changeColor, this);

  this.physics.add.overlap(player, obstacles, hitObstacle, null, this);
}

function createStartUI() {
  const cx = this.cameras.main.centerX;
  const cy = this.cameras.main.centerY;

  const overlay = this.add
    .rectangle(cx, cy, 360, 640, 0x000000, 0.7)
    .setScrollFactor(0);

  const title = this.add
    .text(cx, cy - 160, "COLOR\nMATCH RUN", {
      fontSize: "36px",
      fontStyle: "bold",
      color: "#ffffff",
      align: "center",
    })
    .setOrigin(0.5)
    .setScrollFactor(0);

  const subtitle = this.add
    .text(cx, cy - 60, "Tap to change color\nMatch the obstacles", {
      fontSize: "18px",
      color: "#cccccc",
      align: "center",
    })
    .setOrigin(0.5)
    .setScrollFactor(0);

  const startBtn = this.add
    .rectangle(cx, cy + 80, 220, 64, 0x2ed573)
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setInteractive({ useHandCursor: true });

  const startText = this.add
    .text(cx, cy + 80, "START", {
      fontSize: "26px",
      fontStyle: "bold",
      color: "#000000",
    })
    .setOrigin(0.5)
    .setScrollFactor(0);

  const fakePlayer = this.add
    .rectangle(cx - 80, cy + 240, PLAYER_SIZE, PLAYER_SIZE, COLORS[0])
    .setOrigin(0.5)
    .setScrollFactor(0);

  const fakeObstacle = this.add
    .rectangle(cx + 80, cy + 240, OBSTACLE_WIDTH, OBSTACLE_HEIGHT, COLORS[0])
    .setOrigin(0.5)
    .setScrollFactor(0);

  const arrow = this.add
    .polygon(cx + 10, cy + 240, [0, 0, 24, 12, 0, 24], 0xffffff)
    .setOrigin(0.5)
    .setScrollFactor(0);

  const tapText = this.add
    .text(cx, cy + 150, "TAP TO CHANGE COLOR", {
      fontSize: "16px",
      color: "#ffffff",
    })
    .setOrigin(0.5)
    .setScrollFactor(0);

  startBtn.on("pointerdown", () => {
    startGame.call(this);
  });

  this.tweens.add({
    targets: startBtn,
    scale: 1.05,
    duration: 500,
    yoyo: true,
    repeat: -1,
  });

  this.tweens.add({
    targets: fakePlayer,
    scale: 1.15,
    duration: 250,
    yoyo: true,
    repeat: -1,
  });

  this.time.addEvent({
    delay: 700,
    loop: true,
    callback: () => {
      fakePlayer.fillColor = COLORS[Phaser.Math.Between(0, COLORS.length - 1)];
    },
  });

  startUI.push(overlay, title, subtitle, startBtn, startText);
  tutorialObjects.push(fakePlayer, fakeObstacle, arrow, tapText);
}

function startGame() {
  if (gameStarted) return;
  if (sfx.start) {
    sfx.start.play();
  }

  gameStarted = true;

  startUI.forEach((el) => el.destroy());
  startUI = [];

  tutorialMode = false;

  tutorialObjects.forEach((el) => el.destroy());
  tutorialObjects = [];

  player.setVisible(true);
  scoreText.setVisible(true);

  player.body.setVelocityX(PLAYER_SPEED);
}

function update() {
  if (gameOver || !gameStarted) return;

  obstacles.children.iterate((obs) => {
    if (obs && obs.x < player.x - 200) {
      obs.destroy();
    }
  });
}

function spawnObstacle() {
  if (gameOver || !gameStarted) return;

  const colorIndex = Phaser.Math.Between(0, COLORS.length - 1);

  const obs = this.add.rectangle(
    player.x + 400,
    PLAYER_Y,
    OBSTACLE_WIDTH,
    OBSTACLE_HEIGHT,
    COLORS[colorIndex]
  );

  obs.colorIndex = colorIndex;

  this.physics.add.existing(obs);
  obs.body.setVelocityX(-PLAYER_SPEED);
  obs.body.setImmovable(true);
  obs.body.allowGravity = false;

  obstacles.add(obs);
}

function changeColor() {
  if (gameOver || !gameStarted) return;

  currentColorIndex = (currentColorIndex + 1) % COLORS.length;
  player.fillColor = COLORS[currentColorIndex];
}

function hitObstacle(player, obs) {
  if (gameOver) return;

  if (obs.colorIndex !== currentColorIndex) {
    endGame.call(this);
    return;
  }

  obs.destroy();
  score++;
  scoreText.setText("Score: " + score);
}

function endGame() {
  if (gameOver) return;

  if (sfx.gameOver && !sfx.gameOver.isPlaying) {
    sfx.gameOver.play();
  }

  gameOver = true;
  this.physics.pause();

  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", highScore);
    isNewHighScore = true;
  } else {
    isNewHighScore = false;
  }

  createGameOverUI.call(this);
}

function createGameOverUI() {
  const cx = this.cameras.main.centerX;
  const cy = this.cameras.main.centerY;

  const overlay = this.add
    .rectangle(cx, cy, 360, 640, 0x000000, 1)
    .setScrollFactor(0);

  const title = this.add
    .text(cx, cy - 140, "GAME OVER", {
      fontSize: "40px",
      fontStyle: "bold",
      color: "#ff4757",
    })
    .setOrigin(0.5)
    .setScrollFactor(0);

  const scoreLabel = this.add
    .text(cx, cy - 40, `SCORE\n${score}`, {
      fontSize: "28px",
      color: "#ffffff",
      align: "center",
    })
    .setOrigin(0.5)
    .setScrollFactor(0);

  const highScoreLabel = this.add
    .text(cx, cy + 40, `BEST\n${highScore}`, {
      fontSize: "22px",
      color: "#2ed573",
      align: "center",
    })
    .setOrigin(0.5)
    .setScrollFactor(0);

  if (isNewHighScore) {
    this.time.delayedCall(300, () => {
      createNewRecordBadge(this, cx, cy - 20);
    });
  }

  const playBtn = this.add
    .rectangle(cx, cy + 140, 200, 60, 0x2ed573)
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setInteractive({ useHandCursor: true });

  const playText = this.add
    .text(cx, cy + 140, "PLAY", {
      fontSize: "26px",
      fontStyle: "bold",
      color: "#000000",
    })
    .setOrigin(0.5)
    .setScrollFactor(0);

  this.tweens.add({
    targets: playBtn,
    scale: 1.05,
    duration: 500,
    yoyo: true,
    repeat: -1,
  });

  playBtn.on("pointerdown", () => {
    this.scene.restart();
  });

  gameOverUI.push(
    overlay,
    title,
    scoreLabel,
    highScoreLabel,
    playBtn,
    playText
  );
}

function playHighScorePop(label) {
  label.setScale(0.3);
  label.setAlpha(0);

  this.tweens.add({
    targets: label,
    scale: 1.4,
    alpha: 1,
    duration: 300,
    ease: "Back.Out",
  });

  this.tweens.add({
    targets: label,
    scale: 1.2,
    duration: 400,
    delay: 300,
    yoyo: true,
    repeat: 2,
    ease: "Sine.InOut",
  });

  this.tweens.add({
    targets: label,
    y: label.y - 12,
    duration: 600,
    yoyo: true,
    repeat: -1,
    ease: "Sine.InOut",
  });

  for (let i = 0; i < 10; i++) {
    const particle = this.add.rectangle(
      label.x,
      label.y,
      6,
      6,
      Phaser.Display.Color.RandomRGB().color
    );

    this.tweens.add({
      targets: particle,
      x: label.x + Phaser.Math.Between(-80, 80),
      y: label.y + Phaser.Math.Between(-80, 80),
      alpha: 0,
      scale: 0,
      duration: 700,
      onComplete: () => particle.destroy(),
    });
  }
}

function createNewRecordBadge(scene, x, y) {
  const badgeBg = scene.add
    .rectangle(x, y, 180, 46, 0xffc107, 1)
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(100);

  const badgeText = scene.add
    .text(x, y, "🥇 NEW RECORD!", {
      fontSize: "20px",
      fontStyle: "bold",
      color: "#000000",
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(101);

  badgeBg.setScale(0);
  badgeText.setScale(0);

  scene.tweens.add({
    targets: [badgeBg, badgeText],
    scale: 1.1,
    duration: 280,
    ease: "Back.Out",
  });

  scene.tweens.add({
    targets: badgeBg,
    alpha: { from: 1, to: 0.6 },
    duration: 400,
    yoyo: true,
    repeat: -1,
  });

  scene.tweens.add({
    targets: [badgeBg, badgeText],
    y: y - 6,
    duration: 700,
    yoyo: true,
    repeat: -1,
    ease: "Sine.InOut",
  });
}

function preload() {
  this.load.audio("gameStart", "assets/game-start.mp3");
  this.load.audio("gameOver", "assets/game-over.mp3");
}
