Replace the default canvas edges with custom edges that feel easier
to follow, easier to click, and support inline labels.

## Implementation

1. Add connection handles to every node.
   - place handles on the top, right, bottom, and left sides
   - users should be able to connect from any handle to any other handle
   - keep the handles subtle: small white dots with a dark border
   - hide them by default and fade them in when hovering the node

2. Add a default style for new edges.
   - use a light stroke with rounded ends
   - add an arrowhead at the end of each edge
   - make new connections use the custom canvas edge renderer

3. Create the custom edge renderer.
   - use clean right-angle routing
   - keep edges slightly dimmed at rest
   - brighten edges when hovered or selected
   - make edges easier to hover and click without increasing the
     visible line thickness

4. Add inline edge label editing.
   - double-click an edge to edit its label
   - use React Flow's `EdgeLabelRenderer` and the path midpoint
     coordinates from `getSmoothStepPath` to position the label —
     do not calculate midpoint position manually
   - use an input that grows with the label text
   - save the label on blur, Enter, or Escape
   - show saved labels as small pill badges
   - when an active edge has no label, show a faint hint
   - prevent label clicks and typing from dragging or panning
     the canvas
   - update labels through the existing collaborative edge
     data flow

## Scope Limits

- don't change how nodes are created
- don't change the shape panel
- don't redesign the node renderer beyond the required
  connection handles
- keep this focused on edge rendering, labels, and
  connection behavior

## Check When Done

- Nodes have handles on all four sides.
- New edges use the custom canvas edge type with arrows.
- Edge hover, selection, and label editing are handled in
  the custom edge renderer.
- Edge label position uses EdgeLabelRenderer and path
  midpoint coordinates.
- Edge labels update through the existing edge data flow.
- npm run build passes without type errors.
