Add a small starter template library so users can start a canvas from a pre-built diagram instead of building from scratch.

## Implementation

1. Create `components/editor/starter-templates.ts`.

   Include:
   - a `CanvasTemplate` type
   - a `CANVAS_TEMPLATES` array
   - at least three templates, such as microservices, CI/CD pipeline, and event-driven system

   Each template should include:
   - `id`
   - `name`
   - `description`
   - nodes
   - edges

   Use the shared canvas types and existing node color palette. Add small helper functions if needed to keep the template data readable.

2. Create `components/editor/starter-templates-modal.tsx`.

   The modal should:
   - open as a dialog
   - show template cards in a scrollable grid
   - show the template name and description
   - include an import button for each template
   - call `onImport` with the selected template, then close

3. Add a simple diagram preview to each template card.
   - fit the preview to a fixed-size viewport
   - calculate the preview bounds from the template node positions
   - draw edges as simple lines between node centers
   - draw nodes using their shape and color data
   - keep the preview lightweight, no React Flow instance needed

4. Wire starter templates into the editor.
   - add a navbar button to open the starter templates modal
   - when a template is selected, clear all existing nodes and edges first in the canvas
   - add the selected template nodes and edges after the canvas is cleared
   - make sure the starter template replaces the current canvas instead of being added on top of existing work
   - fit the view after the template is loaded
   - keep this inside the existing collaborative canvas state

## Scope Limits

- don’t add template saving yet
- don’t add custom user templates
- don’t add server persistence
- don’t change node or edge rendering behavior
- keep this focused on importing predefined templates

## Check When Done

- Template data is defined using shared canvas types.
- Import modal renders template cards with previews.
- Import action replaces the current canvas through the existing node and edge state flow.
- Editor navbar includes the import entry point.
- `npm run build` passes.
