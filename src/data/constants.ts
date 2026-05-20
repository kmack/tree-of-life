/**
 * @fileoverview Geometric and label dimension constants for the Tree of Life
 * visualization. Label dimension constants are consumed by the copied
 * `RichLabel` and canvas-texture utilities.
 */

// Label canvas dimensions — consumed by rich-label.tsx and canvas-texture.ts.
export const LABEL_WIDTH_WITH_IMAGE = 900;
export const LABEL_HEIGHT_WITH_IMAGE = 800;
export const LABEL_WIDTH_NO_IMAGE = 512;
export const LABEL_HEIGHT_NO_IMAGE = 320;

// Sephira sphere radius.
export const SEPHIRA_RADIUS = 0.45;

// Horizontal distance from the central pillar to the side pillars (Mercy
// right, Severity left). Tweak to adjust tree width without touching
// individual sephira positions.
export const PILLAR_X_OFFSET = 2.0;

// Path cylinder radii. The pick cylinder is invisible but raycastable so
// touch targets remain comfortable on mobile.
export const PATH_VISIBLE_RADIUS = 0.05;
export const PATH_PICK_RADIUS = 0.15;

// Distance from a sephira's surface to its label.
export const SEPHIRA_LABEL_OFFSET = 0.35;

// Distance from a path's midpoint to its label, perpendicular to the path.
export const PATH_LABEL_OFFSET = 0.4;
