var HEIGHT = 600;
var WIDTH = 800;

class Vec {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class Rect {
  constructor(center, width, height, color) {
    this.center = center;
    this.width = width;
    this.height = height;
    this.color = color;
    this.setPoints();
  }

  setPoints() {
    this.points = [];
    this.points[0] = new Vec(this.center.x - (this.width / 2), this.center.y - (this.height / 2));
    this.points[1] = new Vec(this.center.x + (this.width / 2), this.center.y - (this.height / 2));
    this.points[2] = new Vec(this.center.x + (this.width / 2), this.center.y + (this.height / 2));
    this.points[3] = new Vec(this.center.x - (this.width / 2), this.center.y + (this.height / 2));
  }
}

class Renderer {
  constructor(canvasElement) {
    this.canvasElement = canvasElement;
    this.context = this.canvasElement.getContext("2d");
  }

  drawScreen(color) {
    this.context.fillStyle = color;
    this.context.strokeStyle = color;
    this.context.fillRect(0, 0, WIDTH, HEIGHT);
  }

  drawRect(rect) {
    this.context.fillStyle = rect.color;
    this.context.strokeStyle = rect.color;
    this.context.beginPath();
    this.context.moveTo(rect.points[0].x, rect.points[0].y);
    this.context.lineTo(rect.points[1].x, rect.points[1].y);
    this.context.lineTo(rect.points[2].x, rect.points[2].y);
    this.context.lineTo(rect.points[3].x, rect.points[3].y);
    this.context.fill();
  }

  drawText(text, pos) {
    this.context.fillStyle = text.color;
    this.context.strokeStyle = text.color;
    this.context.font = text.size + "px " + text.font;
    this.context.fillText(text.message, pos.x, pos.y + text.size);
  }

  calcTextWidth(text) {
    this.context.font = text.size + "px " + text.font;
    return this.context.measureText(text.message).width;
  }
}

class Text {
  constructor(message, size, font, color) {
    this.message = message;
    this.size = size;
    this.font = font || "Courier New";
    this.color = color || new Color(255, 255, 255);
  }
}

class Color {
  constructor(r, g, b) {
    this.r = r;
    this.g = g;
    this.b = b;
  }

  toString() {
    return "rgb(" + this.r + ", " + this.g + ", " + this.b + ")";
  }
}

class Scene {
  update(inputState, delta, renderer) {
    throw new Error("update not implemented");
  }
}

class TestScene extends Scene {
  constructor() {
    super();
    this.mass = 1;
    this.acc = new Vec(0, 0);
    this.vel = new Vec(0, 0);
    this.pos = new Vec(0, 0);
  }

  update(inputState, delta, renderer) {
    let speed = 10;

    let force = new Vec(0, 0);
    if (inputState.getKey("w")) {
      force.y -= speed;
    }
    if (inputState.getKey("a")) {
      force.x -= speed;
    }
    if (inputState.getKey("s")) {
      force.y += speed;
    }
    if (inputState.getKey("d")) {
      force.x += speed;
    }

    // http://buildnewgames.com/gamephysics/
    // https://www.ibm.com/developerworks/library/wa-build2dphysicsengine/
    // https://www.khanacademy.org/computing/computer-programming/programming-natural-simulations/programming-forces/a/modeling-gravity-and-friction

    // Move these into applyForce function
    // Think of friction as a force too.
    // Apply friction force
    force.x += (-1 * this.vel.x) * 0.01;
    force.y += (-1 * this.vel.y) * 0.01;
    //

    // Check all deltas
    // Move to using vector functions
    this.acc.x = force.x / this.mass;
    this.acc.y = force.y / this.mass;

    this.vel.x += this.acc.x * delta;
    this.vel.y += this.acc.y * delta;

    this.pos.x += this.vel.x * delta / 1000; // scale values
    this.pos.y += this.vel.y * delta / 1000; // scale values

    let rect = new Rect(this.pos, 40, 40, new Color(255, 255, 255));
    renderer.drawRect(rect);
  }
}

class InputState {
  constructor() {
    this.keyboardState = {};
    this.mouseState = {};
  }

  updateKey(key, state) {
    this.keyboardState[key] = state;
  }

  getKey(key) {
    return this.keyboardState[key] || false;
  }
}

class Core {
  constructor() {
    this.oldTime = performance.now();
    this.newTime = this.oldTime;
    this.canvas = document.getElementById("canvas");
    this.renderer = new Renderer(canvas);
    this.inputState = new InputState();
    this.scene = null;
    this.targetFPS = 60;
    this.currentFPS = 0;
    this.FPSDisplayDelay = 30;
    this.FPSDisplayCount = 0;
  }

  start() {
    // event handlers
    window.requestAnimationFrame(this.updateHandler.bind(this));
    document.addEventListener("keyup", this.keyupHandler.bind(this));
    document.addEventListener("keydown", this.keydownHandler.bind(this));
  }

  setScene(scene) {
    this.scene = scene;
  }

  updateHandler() {
    this.newTime = performance.now();
    let delta = this.newTime - this.oldTime;
    this.oldTime = this.newTime;

    if (delta > (this.targetFPS / 1000)) {
      if (this.scene !== null) {
        let black = new Color(0, 0, 0);
        this.renderer.drawScreen(black);
        if (this.FPSDisplayCount > this.FPSDisplayDelay) {
          this.FPSDisplayCount = 0;
          this.currentFPS = 1000 / delta;
        }
        this.FPSDisplayCount += 1;
        this.drawFPS();

        this.scene.update(this.inputState, delta, this.renderer);
      }
    }

    window.requestAnimationFrame(this.updateHandler.bind(this));
  }

  keyupHandler(event) {
    this.inputState.updateKey(event.key, false);
  }

  keydownHandler(event) {
    this.inputState.updateKey(event.key, true);
  }

  drawFPS() {
    let textSize = 14;
    let message = "FPS: " + this.currentFPS.toFixed(2);
    let text = new Text(message, textSize);
    let textWidth = this.renderer.calcTextWidth(text);
    this.renderer.drawText(text, new Vec(WIDTH - textWidth, 0));
  }
}

let core = new Core();
core.start();
core.setScene(new TestScene());
