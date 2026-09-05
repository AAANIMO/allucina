# Generators

They fill the screen and stay normal objects (movable, scalable, tileable).
Tweak the parameters in the panel and press **Regenerate**.

They are **vector** paths with `objectCaching:false`: they stay **crisp at any
zoom** (no rasterization blur).

## Spiral
A **logarithmic** spiral (grows exponentially from a point, self-similar), as a
**filled** ribbon.
Parameters: **Turns**, **Growth** (magnification per turn), **Thickness**,
**Arms** (equidistant rotations), **Rotation**.

## Stripes
Solid bars filling the screen.
Parameters: **Count**, **Thickness**, **Rotation**.

## Star
Filled *n*-pointed star.
Parameters: **Points** (3–24), **Inner points** (distance of the inner points
from the center = notch depth, 0.1–0.9), **Rotation**.

## Lightning
Parameters: **Count**, **Chaos**, **Branches**, **Thickness**.

## Rays
Rays from the center. Parameters: **Count**, **Thickness**.

## Rings
Concentric circles. Parameters: **Count**, **Thickness**.

---

See **[Development](Development)** to add new generators.
