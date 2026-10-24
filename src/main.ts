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

if (!ctx) throw new Error("oops");

const cursor: Cursor = { active: false, x: 0, y: 0 };

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;
});

canvas.addEventListener("mousemove", (e) => {
  if (cursor.active) {
    ctx.beginPath();
    ctx.moveTo(cursor.x, cursor.y);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
  }
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
});

const clear = document.createElement("button");
clear.textContent = "clear";
tools.append(clear);
clear.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});
