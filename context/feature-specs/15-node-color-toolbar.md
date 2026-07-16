Add a small floating color toolbar so selected nodes can change both their background and text color directly on the canvas.

## Implementation

1. Check `ui-context.md` for the node color palette.
   Each palette option includes:
   - a node background color
   - a matching text color

   Reuse existing theme colors if they already exist in the `global.css`. Otherwise, keep the palette in the canvas types/constants, such as `types/canvas.ts`.

2. Add a toolbar above selected nodes.
   - only show it when the node is selected
   - keep it slightly above the node without overlapping it
   - show one swatch per color pair
   - active swatches should feel clearly selected
   - hovering a swatch should show a subtle glow based on its text color
   - keep the glow tight and controlled, not overly blurred
   - prevent toolbar interactions from dragging nodes or panning the canvas

3. When a swatch is selected:
   - update both the node background color and text color
   - update the node UI immediately
   - keep this inside the existing collaborative canvas state
   - no server calls

4. Selected nodes should visually reflect their active color pair.

   The node background updates to the selected color, and the text automatically updates to its paired text color.

5. Issues:
   - The font size inside the node also scale along with the node size more dynamically. is their is more text adjust it automatically.
   - resizing the nodes is not easyly acessable, means cursur is not able to find the expand edge of the node. make it accessable


## Scope Limits

- don’t change drag/drop behavior
- don’t rebuild node selection logic
- don’t add a full color picker
- keep this focused on predefined color themes only

## Check When Done

- Nodes use predefined background/text color pairs.
- Selected nodes show a floating color toolbar.
- Swatch selection updates both node and text colors.
- `npm run build` passes without type errors.
