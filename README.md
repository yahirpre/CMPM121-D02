# Web Drawing Application! (D2)

## User Documentation

This repository is made to be opened and viewed at https://yahirpre.github.io/CMPM121-D02/.

On page load, the brush size is defaulted to 1, the background color is plain white, the brush black, and very basic emoji stickers are included.

### Brush

- You have the capability to increase the brush size incrementally with buttons or type directly within the value you want.
- Brush color can also be changed at the bottom

### Stickers

- You can use any of the buttons bellow the brush to paste identical stickers onto the drawing canvas. By default, there are 3 emojis as an example.
- This program supports custom sticker functionality. You may add your own text or emojis to be added as an additional tool in the sticker panel.

### Editing

- You have the option to undo, redo, and clear the entire canvas.
- Undoing a clear will bring back the entire canvas as new.

### Exporting

- You can change the background color before exporting at the bottom.
- Exporting will turn the drawing into .png file with 1500 x 1000 resolution.

### Offline use

If you wish to download this program and use it offline, then clone or download this repository to your personal computer, then install [Deno](https://docs.deno.com/runtime/getting_started/installation/) and any dependencies. Once you have that, use a text editor with a terminal and run the script with (ex. > deno task dev).

## Developer Documentation

- Feature to be added: file upload for further custom user sticker input.

This would primarily concern the drawing command toolbox, as we would most likely have to make another DrawingCommand object that is unique to image properties and adding them to the drawingDocument. The biggest issue with this would be mostly interpreting what the image command is and loading/processing the image itself. We would need a way to upload an image as an input field, then a way to load it properly before storing it as a class object. Once all that is said and done, we would still need to update the toolbox graphically to represent the new sticker, such as maybe a small icon of the image itself. Funnily enough, most else would remain unchanged, because the editing commands treat the objects independently of type. Normal stickers, text, and strokes already work this way, so another type wouldn't really bother it. Basically, just stick to the convention.

## Credits

Tooling adapted from the [CMPM 121 Fall 2026 D1 starter](https://github.com/ucsc-cmpm-121-f26/d1-starter/tree/d949e744b0f9fb7c133a5316f86f2b7fe54529ad), derived from the [S01 starter](https://github.com/ucsc-cmpm-121-f26/s01-starter/tree/8974888efb6537be82e8eb069db139ea885039da). Those repositories have no explicit repository license; no new license is assigned to that material. The D2 scaffold was authored with OpenCode/OpenAI GPT-6.1 Sol assistance. Dependencies retain their respective licenses.

Code from https://github.com/rndmcnlly/cmpm-121-f25-quaint-paint/tree/main was referenced to better understand HTML canvas elements, command class implementation, and event targets/handlers.
