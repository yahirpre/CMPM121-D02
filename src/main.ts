const app = document.querySelector<HTMLElement>("#app")!;
const tools = document.querySelector<HTMLElement>("#tools")!;

const canvas = document.createElement("canvas");
canvas.width = 600;
canvas.height = 450;

app.append(canvas);

interface Cursor {
  active: boolean;
  x: number;
  y: number;
}

const ctx = canvas.getContext("2d");

if (!ctx) throw new Error("Failed to get canvas context");

class LineCommand {
  points;

  constructor(x: number, y: number) {
    this.points = [{ x, y }];
  }

  execute() {
    if (ctx) {
      ctx.beginPath();

      const { x, y } = this.points[0];

      ctx.moveTo(x, y);
      this.points.forEach(({ x, y }) => {
        ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
  }
}

let currentLine: LineCommand | null = null;
const commands: LineCommand[] = [];
const redoCommands: LineCommand[] = [];

const bus = new EventTarget();

bus.addEventListener("drawing-changed", redraw);

function notify(name: string) {
  bus.dispatchEvent(new Event(name));
}

function redraw() {
  if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  commands.forEach((command) => command.execute());
}

canvas.addEventListener("mousedown", (e) => {
  currentLine = new LineCommand(e.offsetX, e.offsetY);
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

const clear = document.createElement("button");
clear.textContent = "clear";
tools.append(clear);
clear.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

const undo = document.createElement("button");
undo.textContent = "undo";
tools.append(undo);
undo.addEventListener("click", () => {
  if (commands.length > 0) {
    const command = commands.pop();

    if (command) {
      redoCommands.push(command);
      notify("drawing-changed");
    }
  }
});

const redo = document.createElement("button");
redo.textContent = "redo";
tools.append(redo);
redo.addEventListener("click", () => {
  if (redoCommands.length > 0) {
    const command = redoCommands.pop();

    if (command) {
      commands.push(command);
      notify("drawing-changed");
    }
  }
});
