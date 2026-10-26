const app = document.querySelector<HTMLElement>("#app")!;
const tools = document.querySelector<HTMLElement>("#tools")!;

const CANVAS_WIDTH = 750;
const CANVAS_HEIGHT = 500;

const canvas = document.createElement("canvas");
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

interface Cursor {
  active: boolean;
  x: number;
  y: number;
}

const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("Failed to get canvas context");
ctx.lineCap = "round";

class LineCommand {
  points: [{
    x: number;
    y: number;
  }];
  stroke: number = 1;

  constructor(x: number, y: number, stroke: number = 1) {
    this.points = [{ x, y }];
    this.stroke = stroke;
  }

  execute() {
    if (ctx) {
      ctx.beginPath();

      const { x, y } = this.points[0];

      ctx.moveTo(x, y);
      this.points.forEach(({ x, y }) => {
        ctx.lineTo(x, y);
      });
      ctx.lineWidth = this.stroke;
      ctx.stroke();
    }
  }
}

function notify(name: string) {
  bus.dispatchEvent(new Event(name));
}

function redraw() {
  if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  commands.forEach((command) => command.execute());
}

function createButton(label: string, callback: () => void): HTMLButtonElement {
  const button = document.createElement("button");
  button.textContent = label;
  button.addEventListener("click", callback);
  return button;
}

let currentLine: LineCommand | null = null;
let currentStroke = 1;
const commands: LineCommand[] = [];
const redoCommands: LineCommand[] = [];

const bus = new EventTarget();

bus.addEventListener("drawing-changed", redraw);

canvas.addEventListener("mousedown", (e) => {
  currentLine = new LineCommand(e.offsetX, e.offsetY, currentStroke);
  commands.push(currentLine);
  redoCommands.splice(0, redoCommands.length);
  notify("drawing-changed");
});

canvas.addEventListener("mousemove", (e) => {
  if (e.buttons == 1) {
    if (currentLine) currentLine.points.push({ x: e.offsetX, y: e.offsetY });
    notify("drawing-changed");
  }
});

canvas.addEventListener("mouseup", () => {
  currentLine = null;
  notify("drawing-changed");
});

canvas.addEventListener("mouseleave", () => {
  currentLine = null;
  notify("drawing-changed");
});

const clear = createButton("clear", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

const undo = createButton("undo", () => {
  if (commands.length > 0) {
    const command = commands.pop();

    if (command) {
      redoCommands.push(command);
      notify("drawing-changed");
    }
  }
});

const redo = createButton("redo", () => {
  if (redoCommands.length > 0) {
    const command = redoCommands.pop();

    if (command) {
      commands.push(command);
      notify("drawing-changed");
    }
  }
});

const strokeDecrease = createButton("-", () => {
  if (currentStroke > 1) currentStroke--;
});

const strokeIncrease = createButton("+", () => {
  currentStroke++;
});

tools.append(clear, undo, redo, strokeDecrease, strokeIncrease);
app.append(canvas);
