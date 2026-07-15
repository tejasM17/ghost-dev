Replace the canvas placeholder with a Liveblocks-backed React Flow canvas.

## Implementation

1. Keep the workspace page server-side.

2. Create a client-side editor/canvas wrapper that sets up the Liveblocks room.

   It should include:
   - `LiveblocksProvider` using `/api/liveblocks-auth`
   - `RoomProvider` using the current room ID
   - initial presence with `cursor: null`
   - `ClientSideSuspense` with a simple loading state
   - an error fallback for Liveblocks connection issues

3. Wire React Flow to Liveblocks state.
   - use `useLiveblocksFlow`
   - enable suspense
   - start with empty nodes and edges
   - pass the synced nodes, edges, and change handlers into `ReactFlow`

4. Add shared canvas types in `types/canvas.ts`.

   Node data should support:
   - label
   - color
   - shape

   Also define the custom node and edge types:
   - `canvasNode`
   - `canvasEdge`

5. Render the basic canvas.

   Include:
   - loose connection behavior
   - `fitView`
   - `MiniMap`
   - dot-pattern background

## Scope Limits

- don’t add controls yet
- don’t add custom node or edge rendering yet
- don’t add persistence logic
- don’t add AI behavior
- keep this focused on the collaborative canvas foundation

## Check When Done

- Client canvas wrapper sets up the Liveblocks room.
- React Flow uses Liveblocks-synced nodes and edges.
- Shared canvas types exist in `types/canvas.ts`.
- `npm run build` passes.
