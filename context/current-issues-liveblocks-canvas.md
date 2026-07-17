Review the editor workspace implementation and fix the following
issues. Check `components/editor` first. Do not break existing
features.

## Issues

### 1. Save Button in Workspace Navbar

**Status: pending to test**

Read the navbar component and the autosave hook before
implementing.

The workspace navbar is missing a Save button. The autosave
hook already exists and tracks saving/saved/error states —
wire the button to it.

Add the Save button to the workspace navbar only. The navbar
is shared with editor home so conditionally render the button
based on workspace context — it must not appear on the editor
home navbar.

Button behavior:

- default state: shows "Save"
- while saving: shows "Saving..."
- after successful save: shows "Saved" briefly then returns
  to "Save"
- on error: shows "Error" briefly then returns to "Save"
- clicking it triggers a manual save through the same save
  function the autosave hook uses

Also fix the canvas save API route. Open the route file at
`app/api/projects/[projectId]/canvas/route.ts` and make
these two changes:

- in the PUT handler change `access: "public"` to
  `access: "private"` in the Vercel Blob put call
- in the GET handler replace any raw fetch call with the
  Vercel Blob SDK to retrieve the blob content using the
  stored URL

Do not change anything else.

### 2. Delete Nodes and Edges

**Status: fixed (use onDelete; remove changes are no-ops in liveblocks react-flow)**

Read Liveblocks agent skills before implementing this.
Then read the canvas wrapper component and the existing
node and edge mutation helpers.

Selected nodes and edges cannot be deleted from the canvas.

Add a keydown event listener to the canvas wrapper that:

- listens for Delete and Backspace keys
- does not fire when the event target is an input, textarea,
  or contenteditable element
- gets currently selected nodes using useNodes() filtered
  by selected state
- gets currently selected edges using useEdges() filtered
  by selected state
- removes them using the existing Liveblocks collaborative
  mutation helpers

Do not use React Flow's built-in deleteKeyCode or any
React Flow keyboard deletion behavior. All deletions must
go through the existing Liveblocks collaborative state so
they sync across all connected clients in real time.

Do not change anything else.

### 3. Node Connection Handles

**Status: fixed**

Read Liveblocks agent skills before implementing this.

Nodes can only be connected from the top handle. All four
handles — top, right, bottom, left — should be active and
connectable. Check the existing Handle components in the
custom node renderer. Verify each handle has the correct
position prop and that no CSS is hiding or disabling the
non-top handles. Connection between any two handles on any
two nodes should work and sync through the existing
Liveblocks edge state.

### 4. Drag and Drop Position Offset

**Status: fixed**

Read Liveblocks agent skills before implementing this.

When dropping a shape from the shape panel onto the canvas,
the node places below where the cursor actually is.

Check the drop handler in the canvas wrapper. The position
calculation must account for:

- the drag offset from where the user grabbed the shape
  inside the drag element, not just the element's top-left
  corner
- the canvas container's bounding rect
- the current React Flow pan offset and zoom scale via
  screenToFlowPosition or project

The node should appear with its center at the exact cursor
position on drop.

### 5. Auto Zoom on First Node Drop

**Status: fixed**

Read Liveblocks agent skills before implementing this.

Dropping the first node onto a fully empty canvas causes an
automatic zoom-in. This does not happen when other nodes
exist. Check the drop handler and any fitView or fitBounds
calls that may be triggered after the first node is added.
Disable or guard any automatic fit/zoom behavior so it does
not fire during a drop event. The viewport should stay
exactly where the user left it after dropping a node.

### 6. Collaborator Avatar Image Error

**Status: fixed**

Check Clerk agent skills before implementing this.

Add img.clerk.com to the allowed image hostnames in
next.config.js using the correct remotePatterns
configuration.

### 7. Remove UserButton from Workspace Navbar

**Status: already fixed (left as-is)**

Check Clerk agent skills before implementing this.

Remove the UserButton from the workspace navbar only. The
navbar is shared so make sure the UserButton remains on the
editor home navbar. Conditionally render it based on whether
the component is being used in the workspace context or the
editor home context.

### 8. UI Update

**Status: fixed**

check at `feature-specs/iamge/image-2.png`

only improve the ui when creating the new project.

## Scope

- Fix only what is listed above
- Do not change canvas node or edge rendering behavior
- Do not modify the editor home navbar layout
- Do not break existing autosave, presence, or collaboration
  logic
- npm run build passes
