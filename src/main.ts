const app = document.querySelector<HTMLElement>("#app")!;
const tools = document.querySelector<HTMLElement>("#tools")!;
const strokeTools = document.querySelector<HTMLElement>("#strokeTools")!;

const CANVAS_WIDTH = 750;
const CANVAS_HEIGHT = 500;

const canvas = document.createElement("canvas");
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("Failed to get canvas context");
ctx.lineCap = "round";

type HistoryAction =
  | { type: "line"; command: LineCommand }
  | { type: "clear"; commands: LineCommand[] };

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

function updateStrokeText() {
  strokeLabel.value = `${currentStroke}`;
}

let currentLine: LineCommand | null = null;
let currentStroke = 1;

const history: HistoryAction[] = [];
const redoHistory: HistoryAction[] = [];

const commands: LineCommand[] = [];

const bus = new EventTarget();

bus.addEventListener("drawing-changed", redraw);

canvas.addEventListener("mousedown", (e) => {
  currentLine = new LineCommand(e.offsetX, e.offsetY, currentStroke);
  commands.push(currentLine);

  history.push({ type: "line", command: currentLine });
  redoHistory.splice(0, redoHistory.length);

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
  if (commands.length === 0) {
    return;
  }

  history.push({ type: "clear", commands: [...commands] });

  commands.splice(0, commands.length);
  redoHistory.splice(0, commands.length);

  notify("drawing-changed");
});

const undo = createButton("undo", () => {
  const action = history.pop();
  if (!action) {
    return;
  }

  if (action.type === "clear") {
    commands.push(...action.commands);
  } else if (action.type === "line") {
    const foundAt = commands.indexOf(action.command);

    // a {-1} value here means that the history command is nowhere seen in the list
    if (foundAt !== -1) {
      commands.splice(foundAt, 1);
    }
    // we check because it is not guaranteed to have matching sizes between history/commands
    // Ex. History: {type: 'blah', cmds: [da, ra, fo]}, {type: "boo", cmds: hehe}
    //     Commands: da, ra, fo, hehe
    //    length is 2 compared to 4
  }

  redoHistory.push(action);
  notify("drawing-changed");
});

const redo = createButton("redo", () => {
  const action = redoHistory.pop();

  if (!action) {
    return;
  }

  if (action.type === "clear") {
    commands.splice(0, commands.length);
  } else if (action.type === "line") {
    commands.push(action.command);
  }

  history.push(action);
  notify("drawing-changed");
});

const brushLabel = document.createElement("label");
brushLabel.textContent = "Brush Size:";
brushLabel.style = `
      font-size: 12px;
      margin-inline: 4px;
      margin-top: 6px;
    `;

const strokeLabel = document.createElement("input");
strokeLabel.type = "input";
strokeLabel.inputMode = "numeric";
strokeLabel.maxLength = 3;
strokeLabel.size = 1;
strokeLabel.placeholder = "1";
strokeLabel.textContent = `${currentStroke}`;

strokeLabel.addEventListener("input", () => {
  strokeLabel.value = strokeLabel.value.replace(/[^0-9]/g, "");
  const value: number = Number(strokeLabel.value);
  if (!Number.isNaN(value)) {
    currentStroke = value;
  }
  updateStrokeText();
});

const strokeDecrease = createButton("-", () => {
  if (currentStroke > 1) currentStroke--;
  updateStrokeText();
});

const strokeIncrease = createButton("+", () => {
  currentStroke++;
  updateStrokeText();
});

strokeTools.append(strokeDecrease, brushLabel, strokeLabel, strokeIncrease);
tools.append(clear, undo, redo, strokeTools);
app.append(canvas);
