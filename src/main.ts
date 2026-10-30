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
  | { type: "add"; command: DrawingCommand }
  | { type: "clear"; commands: DrawingCommand[] };

interface DrawingCommand {
  execute(target: CanvasRenderingContext2D): void;
}

class DrawingDocument {
  commands: DrawingCommand[] = [];

  history: HistoryAction[] = [];
  redoHistory: HistoryAction[] = [];

  backgroundColor: string = "white";

  add(command: DrawingCommand) {
    this.commands.push(command);
    this.history.push({ type: "add", command });
    this.redoHistory.length = 0;
  }

  clear() {
    if (this.commands.length === 0) {
      return;
    }

    this.history.push({ type: "clear", commands: [...this.commands] });

    this.commands.splice(0, this.commands.length);
    this.redoHistory.length = 0;
  }

  undo() {
    const action = this.history.pop();
    if (!action) {
      return;
    }

    if (action.type === "clear") {
      this.commands.push(...action.commands);
    } else if (action.type === "add") {
      const foundAt = this.commands.indexOf(action.command);

      // a {-1} value here means that the history command is nowhere seen in the list
      if (foundAt !== -1) {
        this.commands.splice(foundAt, 1);
      }
      // we check because it is not guaranteed to have matching sizes between history/commands
      // Ex. History: {type: 'blah', cmds: [da, ra, fo]}, {type: "boo", cmds: hehe}
      //     Commands: da, ra, fo, hehe
      //    length is 2 compared to 4
    }

    this.redoHistory.push(action);
  }

  redo() {
    const action = this.redoHistory.pop();

    if (!action) {
      return;
    }

    if (action.type === "clear") {
      this.commands.splice(0, this.commands.length);
    } else if (action.type === "add") {
      this.commands.push(action.command);
    }

    this.history.push(action);
  }
}

class LineCommand implements DrawingCommand {
  points: { x: number; y: number }[];
  stroke: number;
  color: string;

  constructor(
    x: number,
    y: number,
    stroke: number = 1,
    color: string = "black",
  ) {
    this.points = [{ x, y }];
    this.stroke = stroke;
    this.color = color;
  }

  execute(target: CanvasRenderingContext2D) {
    target.save();
    target.beginPath();
    target.lineCap = "round";
    target.lineWidth = this.stroke;
    target.strokeStyle = this.color;

    target.moveTo(this.points[0].x, this.points[0].y);

    for (const point of this.points) {
      target.lineTo(point.x, point.y);
    }

    target.stroke();
    target.restore();
  }
}

class StickerCommand implements DrawingCommand {
  constructor(
    public x: number,
    public y: number,
    public content: string,
  ) {}

  execute(target: CanvasRenderingContext2D) {
    target.save();
    target.font = "40px sans-serif";
    target.textAlign = "center";
    target.textBaseline = "middle";
    target.fillStyle = "black";
    target.fillText(this.content, this.x, this.y);
    target.restore();
  }
}

function notify(name: string) {
  bus.dispatchEvent(new Event(name));
}

function redraw() {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = drawingDocument.backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  renderDocument(ctx, drawingDocument.commands);

  if (currentLine) {
    currentLine.execute(ctx);
  }
}

function renderDocument(
  canvas: CanvasRenderingContext2D,
  commands: DrawingCommand[],
  scale: number = 1,
) {
  canvas.save();
  canvas.scale(scale, scale);

  commands.forEach((command) => {
    command.execute(canvas);
  });

  canvas.restore();
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
let currentColor = "black";

const drawingDocument = new DrawingDocument();

const bus = new EventTarget();

type ToolDefinition = {
  name: string;
  content: string;
};

const stickerTools: ToolDefinition[] = [
  { name: "Star", content: "⭐" },
  { name: "Heart", content: "❤️" },
  { name: "Smile", content: "😀" },
];

let selectedTool: ToolDefinition | null = null;

function addDrawingCommand(command: DrawingCommand) {
  drawingDocument.add(command);
  notify("drawing-changed");
}

bus.addEventListener("drawing-changed", redraw);

canvas.addEventListener("mousedown", (e) => {
  if (e.button !== 0) return;

  if (selectedTool) {
    const sticker = new StickerCommand(
      e.offsetX,
      e.offsetY,
      selectedTool.content,
    );

    addDrawingCommand(sticker);
    return;
  }

  currentLine = new LineCommand(
    e.offsetX,
    e.offsetY,
    currentStroke,
    currentColor,
  );

  notify("drawing-changed");
});

canvas.addEventListener("mousemove", (e) => {
  if (e.buttons === 1 && currentLine) {
    currentLine.points.push({
      x: e.offsetX,
      y: e.offsetY,
    });

    notify("drawing-changed");
  }
});

canvas.addEventListener("mouseup", () => {
  if (currentLine) {
    const completedLine = currentLine;
    currentLine = null;
    addDrawingCommand(completedLine);
  }
});

canvas.addEventListener("mouseleave", () => {
  currentLine = null;
  notify("drawing-changed");
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    currentLine = null;
    notify("drawing-changed");
  }
});

const clear = createButton("clear", () => {
  drawingDocument.clear();
  notify("drawing-changed");
});

const undo = createButton("undo", () => {
  drawingDocument.undo();
  notify("drawing-changed");
});

const redo = createButton("redo", () => {
  drawingDocument.redo();
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
strokeLabel.type = "text";
strokeLabel.inputMode = "numeric";
strokeLabel.maxLength = 3;
strokeLabel.size = 1;
strokeLabel.placeholder = "1";
strokeLabel.value = `${currentStroke}`;

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

const palette = document.createElement("div");

function renderPalette() {
  palette.replaceChildren();

  const brushButton = createButton("Brush", () => {
    selectedTool = null;
    renderPalette();
  });

  palette.append(brushButton);

  stickerTools.forEach((tool) => {
    const button = createButton(tool.name, () => {
      selectedTool = tool;
      renderPalette();
    });

    palette.append(button);
  });
}

const colorDiv = document.createElement("div");

const bgColorLabel = document.createElement("label");
bgColorLabel.textContent = "Background:";
bgColorLabel.style = `
      font-size: 12px;
      margin-inline: 4px;
      margin-top: 6px;
    `;

const bgColor = document.createElement("input");
bgColor.type = "color";
bgColor.value = drawingDocument.backgroundColor;

bgColor.addEventListener("input", () => {
  drawingDocument.backgroundColor = bgColor.value;
  redraw();
});

const brushColorLabel = document.createElement("label");
brushColorLabel.textContent = "Brush:";
brushColorLabel.style = `
      font-size: 12px;
      margin-inline: 4px;
      margin-top: 6px;
    `;

const brushColor = document.createElement("input");
brushColor.type = "color";
brushColor.value = currentColor;

brushColor.addEventListener("input", () => {
  currentColor = brushColor.value;
});

colorDiv.append(bgColorLabel, bgColor, brushColorLabel, brushColor);

function exportImage() {
  const exportCanvas = document.createElement("canvas");

  const exportScale = 2;

  exportCanvas.width = canvas.width * exportScale;
  exportCanvas.height = canvas.height * exportScale;

  const exportCtx = exportCanvas.getContext("2d");
  if (!exportCtx) return;

  exportCtx.fillStyle = drawingDocument.backgroundColor;
  exportCtx.fillRect(
    0,
    0,
    exportCanvas.width,
    exportCanvas.height,
  );

  renderDocument(exportCtx, drawingDocument.commands, exportScale);

  exportCanvas.toBlob((blob) => {
    if (!blob) {
      return;
    }

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.download = "drawing.png";
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}

const toolNameInput = document.createElement("input");
toolNameInput.placeholder = "Tool name";

const toolContentInput = document.createElement("input");
toolContentInput.placeholder = "Emoji or text";

const createToolButton = createButton("Create Tool", () => {
  const name = toolNameInput.value.trim();
  const content = toolContentInput.value.trim();

  if (!content) return;

  stickerTools.push({
    name: name || content,
    content,
  });

  toolNameInput.value = "";
  toolContentInput.value = "";

  renderPalette();
});

const cancelButton = createButton("Cancel", () => {
  toolNameInput.value = "";
  toolContentInput.value = "";
});

renderPalette();

tools.append(
  palette,
  toolNameInput,
  toolContentInput,
  createToolButton,
  cancelButton,
);

const exportButton = createButton("Export PNG", exportImage);

tools.append(exportButton, colorDiv);
