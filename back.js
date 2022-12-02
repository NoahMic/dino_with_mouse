/**@type {HTMLCanvasElement} */
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const getJSON = (url, callback) => {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);
  xhr.responseType = "json";
  xhr.onload = () => {
    const status = xhr.status;
    if (status == 200) {
      callback(null, xhr.response);
    } else {
      callback(status, xhr.response);
    }
  };
  xhr.send();
};

let score;
/**@type {ScoreText} */
let scoreText;
/**@type {ScoreText} */
let highScoreText;
let highScore;
/**@type {Dino} */
let dino;
let gravity;
/**@type {Obstacle[]} */
let obstacles = [];
/**@type {AttackObstacle[]} */
let attackObstacles = [];
let lines = [];
let gameSpeed;
let keys = {};
let ws;
let coolTime = 0;

document.addEventListener("keydown", (event) => {
  keys[event.code] = true;
});

document.addEventListener("keyup", (event) => {
  keys[event.code] = false;
});

canvas.addEventListener("click", (event) => {
  const { offsetX, offsetY } = event;
  lines.push(new line(dino.x + 25, dino.y, offsetX, offsetY, 30));
  for (let i = 0; i < attackObstacles.length; i++) {
    const attackObstacle = attackObstacles[i];
    if (
      attackObstacle.x < offsetX + 35 &&
      attackObstacle.x + attackObstacle.w > offsetX - 35 &&
      attackObstacle.y < offsetY + 35 &&
      attackObstacle.y + attackObstacle.h > offsetY - 35
    ) {
      score += Math.round(3000 / attackObstacles[i].w);
      attackObstacles[i] = new AttackObstacle();
    }
  }
});

class line {
  constructor(x, y, nx, ny, w) {
    this.x = x;
    this.y = y;
    this.nx = nx;
    this.ny = ny;
    this.w = w;
    console.log(this.w);
  }
  Draw() {
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.nx, this.ny);
    ctx.closePath();
    ctx.stroke();
  }
}
class Dino {
  constructor(x, y, w, h, c) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.c = c;

    this.dy = 0;
    this.jumpForce = 15;
    this.originalHeight = h;
    this.grounded = false;
    this.img = new Image();
    this.img.src = "./dino_up.png";
    this.jumpTimer = 0;
  }

  Draw() {
    // ctx.beginPath();
    // ctx.fillStyle = this.c;
    // ctx.fillRect(this.x, this.y, this.w, this.h);
    // ctx.closePath();
    // this.img.src = "dino_up.png";
    if ((keys["ShiftLeft"] || keys["KeyS"]) && this.grounded) {
      this.img.src = "dino_down.png";
    } else {
      this.img.src = "dino_up.png";
    }

    ctx.drawImage(this.img, this.x, this.y, this.w, this.h);
  }

  Jump() {
    if (this.grounded && this.jumpTimer == 0) {
      this.jumpTimer = 1;
      this.dy - -this.jumpForce;
    } else if (this.jumpTimer > 0 && this.jumpTimer < 15) {
      this.jumpTimer++;
      this.dy = -this.jumpForce - this.jumpTimer / 50;
    }
  }

  Animate() {
    if (keys["Space"] || keys["KeyW"]) this.Jump();
    else this.jumpTimer = 0;

    if ((keys["ShiftLeft"] || keys["KeyS"]) && this.grounded) {
      this.h = this.originalHeight / 2;
      this.y += this.y / 2;
    } else {
      this.h = this.originalHeight;
    }

    this.y += this.dy;

    if (this.y + this.h < canvas.height) {
      this.dy += gravity;
      this.grounded = false;
    } else {
      this.dy = 0;
      this.grounded = true;
      this.y = canvas.height - this.h;
    }

    // this.y += this.dy;
    this.Draw();
  }
}

class Obstacle {
  constructor(x, y, w, h, c) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.c = c;

    this.dx = -gameSpeed;
    this.isBird = false;
  }

  Update() {
    this.x += this.dx;
    this.Draw();
    this.dx = -gameSpeed;
  }

  Draw() {
    // ctx.beginPath();
    // ctx.fillStyle = this.c;
    // ctx.fillRect(this.x, this.y, this.w, this.h);
    // ctx.closePath();
    this.img = new Image();
    if (this.isBird == true) {
      this.img.src = "./bird.png";
      ctx.drawImage(this.img, this.x, this.y, this.w, this.h);
    } else {
      this.img.src = "./catus.png";
      ctx.drawImage(this.img, this.x, this.y, this.w, this.h);
    }
    // ctx.drawImage(this.img, this.x, this.y, this.w, this.h);
  }
}



class ScoreText {
  constructor(t, x, y, a, c, s) {
    this.t = t;
    this.x = x;
    this.y = y;
    this.a = a;
    this.c = c;
    this.s = s;
  }

  Draw() {
    ctx.beginPath();
    ctx.fillStyle = this.c;
    ctx.font = this.s + "px sans-serif";
    ctx.textAlign = this.a;
    ctx.fillText(this.t, this.x, this.y);
    ctx.closePath();
  }
}

function SpawnObstacle() {
  let size = RandomIntInRange(20, 70);
  let type = RandomIntInRange(0, 1);
  let obstacle = new Obstacle(
    canvas.width + size,
    canvas.height - size,
    size,
    size,
    "#2484E4"
  );

  if (type == 1) {
    obstacle.y -= dino.originalHeight - 10;
    obstacle.isBird = true;
  }
  obstacles.push(obstacle);
}

class AttackObstacle extends Obstacle {
  Draw() {
    this.img = new Image();
    this.img.src = "./target.png";
    ctx.drawImage(this.img, this.x, this.y, this.w, this.h);
  }
}

function SpawnAttackObstacle() {
  let size = RandomIntInRange(20, 70);
  let y = RandomIntInRange(size, canvas.height - size);
  let attackObstacle = new AttackObstacle(
    RandomIntInRange(Math.max(canvas.width / 4, dino.x + 20), canvas.width),
    y, size, size, "red"
  );
  attackObstacles.push(attackObstacle);
}

function RandomIntInRange(min, max) {
  return Math.round(Math.random() * (max - min) + min);
}

function Start() {
  console.log(ws);
  canvas.width = window.innerWidth - 100;
  canvas.height = window.innerHeight - 100;

  ctx.font = "20px sans-serif";

  gameSpeed = 3;
  gravity = 1;
  score = 0;
  highScore = 0;

  if (localStorage.getItem("highscore")) {
    highScore = localStorage.getItem("highscore");
  }

  dino = new Dino(25, canvas.height - 150, 50, 50, "yellow");

  scoreText = new ScoreText("Score: " + score, 25, 25, "left", "#212121", "20");
  highScoreText = new ScoreText(
    "Highscore: " + highScore,
    canvas.width - 25,
    25,
    "right",
    "#212121",
    "20"
  );

  requestAnimationFrame(Update);
}

let initialSpwanTimer = 200;
let initialSpwanTimer2 = 100;
let spwanTimer = initialSpwanTimer;
let spwanTimer2 = initialSpwanTimer2;

function init() {
  obstacles = [];
  attackObstacles = [];
  score = 0;
  spwanTimer = initialSpwanTimer;
  spwanTimer2 = initialSpwanTimer2;
  gameSpeed = Math.max(3, ws);

  localStorage.setItem("highscore", highScore);
}

function Update() {
  requestAnimationFrame(Update);
  coolTime--;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  dino.Animate();

  spwanTimer--;
  if (spwanTimer <= 0) {
    SpawnObstacle();
    spwanTimer = initialSpwanTimer - gameSpeed * 8;

    if (spwanTimer < 60) spwanTimer = 60;
    spwanTimer += RandomIntInRange(-40, 40);
  }

  spwanTimer2--;
  if (spwanTimer2 <= 0) {
    SpawnAttackObstacle();
    spwanTimer2 = initialSpwanTimer2 - gameSpeed * 4;

    if (spwanTimer2 < 40) spwanTimer2 = 40;
    spwanTimer2 += RandomIntInRange(-20, 20);
  }
  for (let i = 0; i < obstacles.length; i++) {
    let o = obstacles[i];

    if (o.x + o.w < 0) obstacles.splice(i, 1);
    if (
      dino.x + 5 < o.x + o.w &&
      dino.x + dino.w - 5 > o.x &&
      dino.y + 5 < o.y + o.h &&
      dino.y + dino.h - 5 > o.y
    )
      init();

    o.Update();
  }

  for (let i = 0; i < attackObstacles.length; i++) {
    let o = attackObstacles[i];

    if (o.x + o.w < 0) attackObstacles.splice(i, 1);

    if (
      dino.x + 5 < o.x + o.w &&
      dino.x + dino.w - 5 > o.x &&
      dino.y + 5 < o.y + o.h &&
      dino.y - 5 + dino.h > o.y
    )
      init();

    o.Update();
  }
  for (let i = 0; i < lines.length; i++) {
    let o = lines[i];
    if (o.w < 0) lines.splice(i, 1);
    else {
      o.Draw();
      o.w--;
      console.log(o.w);
    }
  }

  gameSpeed += Math.max(0.003, ws * 0.001);
  score += Math.round(gameSpeed / 10);
  scoreText.t = "Score: " + score;
  scoreText.Draw();

  if (score > highScore) {
    highScore = score;
    highScoreText.t = "Highscore: " + highScore;
  }

  highScoreText.Draw();
  windspeed.Draw();
}

Start();
getJSON(
  `https://api.openweathermap.org/data/2.5/weather?lat=-88.54281347234269&lon=126.96677338393458&appid=8e2a3b45bb53866c77b5bc6f79ef00cc`,
  (err, data) => {
    ws = data.wind.speed;
    console.log(ws);
    gameSpeed = Math.max(3, ws);
    windspeed = new ScoreText(
      "Windspeed: " + ws,
      canvas.width / 2,
      25,
      "center",
      "#212121",
      "20"
    );
  }
);
