
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


const config = {
  type: Phaser.AUTO,
  width: 360,
  height: 640,
  backgroundColor: "#000000",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: { preload, create, update }
};

new Phaser.Game(config);

function preload() {}

function create() {
  score = 0;
  gameOver = false;
  currentColorIndex = 0;

  /* PLAYER */
  player = this.add.rectangle(
    PLAYER_X,
    PLAYER_Y,
    PLAYER_SIZE,
    PLAYER_SIZE,
    COLORS[currentColorIndex]
  );
  this.physics.add.existing(player);

  player.body.setVelocityX(PLAYER_SPEED);
  player.body.setImmovable(true);
  player.body.allowGravity = false;

  /* CAMERA */
  this.cameras.main.startFollow(player);
  this.cameras.main.setBounds(0, 0, 100000, 640);

  /* PLAYER PULSE */
  this.tweens.add({
    targets: player,
    scale: 1.1,
    duration: 300,
    yoyo: true,
    repeat: -1
  });

  obstacles = this.physics.add.group();

  this.time.addEvent({
    delay: 900,
    loop: true,
    callback: () => spawnObstacle.call(this)
  });

  scoreText = this.add.text(20, 20, "Score: 0", {
    fontSize: "22px",
    color: "#ffffff"
  });
  scoreText.setScrollFactor(0);

  this.input.on("pointerdown", changeColor, this);

  this.physics.add.overlap(
    player,
    obstacles,
    hitObstacle,
    null,
    this
  );
}

function update() {
  if (gameOver) return;

  obstacles.children.iterate(obs => {
    if (obs && obs.x < player.x - 200) {
      obs.destroy();
    }
  });
}


function spawnObstacle() {
  if (gameOver) return;

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
  if (gameOver) return;

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
  
    gameOver = true;
    this.physics.pause();
  
    const text = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      "GAME OVER\nTap to Restart",
      {
        fontSize: "28px",
        color: "#ffffff",
        align: "center"
      }
    ).setOrigin(0.5);
  
    text.setScrollFactor(0);
  
    this.input.once("pointerdown", () => {
      this.scene.restart();
    });
  }
  
