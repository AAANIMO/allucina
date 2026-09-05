# Properties panel

- **Object list**: a collapsible section at the top with every object in the
  scene (topmost in the z-order first). Click an entry to select it — handy with
  many overlapping objects. The **▲ / ▼** arrows move the object **forward /
  backward**, live in both the list and the canvas.
- **Color**: per-object color (default white; **White** resets). On
  shapes/text/SVG/generated it's the fill/stroke; on images it's a **tint**
  (multiply). Brightness darkens the chosen color.
- **Brightness**, **Opacity**, **Edge blur** (soft light).
- **Flip H / Flip V** (mirror).
- **Invert colors (object)**: inverts a **single** object's colors (black↔white),
  independent of the global invert. E.g. a black circle on a white square. On
  images it applies an invert filter.
- **Black & white (image)**: grayscale (images only).
- **Tile**: repeats the object across the whole screen, aligned during pan/zoom.
  Besides **Spacing**:
  - **Row offset (X)** / **Column offset (Y)**: stagger odd rows/columns
    (0–100%) — 50% on X gives the classic brick pattern.
  - **Alternate Flip H / V**: mirror tiles in a checkerboard (every other one).
- **Duplicate**, **Delete**.
- **Z-order**: from the object list with ▲ / ▼. Keyboard: `[` / `]` one level,
  `Shift+[` / `Shift+]` to back / to front.
