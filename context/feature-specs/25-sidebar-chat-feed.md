Add real-time room chat to the AI sidebar using a separate Liveblocks `ai-chat` feed.

This is only for chat messages. Keep it separate from `ai-status-feed`, which handles AI progress and presence updates.

## Implementation

1. Add the `ai-chat` feed.

   Before implementing, check the existing Liveblocks setup and follow the same feed patterns already used in the project.
   - create or reuse a Liveblocks feed named `ai-chat`
   - keep it room-scoped
   - do not mix it with `ai-status-feed`

2. Wire the chat feed into the sidebar.
   - subscribe to `ai-chat` in the sidebar chat area
   - render chat messages in order
   - show sender, timestamp, and message content
   - keep the styling consistent with the existing sidebar UI
   - use Tailwind utilities and existing shadcn components where they fit

3. Add message sending.
   - allow users in the room to send messages to `ai-chat`
   - use the existing sidebar input and send button
   - clear the input after a successful send
   - show a small error state if sending fails

4. Add message validation.
   - define or reuse a Zod schema in `types/tasks.ts`
   - message shape should include sender, role, content, and timestamp
   - validate feed messages before rendering them

5. Issues:
   - When collaborator try to open up the project getting an anusual error fix it:
   - ERROR: 
   ```
   ## Error Type
Runtime Error

## Error Message
Feed messages fetch timeout


    at AiSidebar (components/editor/ai-sidebar.tsx:179:15)
    at WorkspaceShell (components/editor/workspace-shell.tsx:131:9)
    at EditorRoomPage (app/editor/[roomId]/page.tsx:59:5)

## Code Frame
  177 |           >
  178 |             {roomConnected ? (
> 179 |               <RoomAwareArchitectTab
      |               ^
  180 |                 messages={messages}
  181 |                 input={input}
  182 |                 textareaRef={textareaRef}

Next.js version: 16.2.10 (Turbopack)
```

## Scope Limits

- don’t add AI-generated replies yet
- don’t trigger backend AI tasks
- don’t mix chat messages with status messages
- don’t create a parallel realtime system outside Liveblocks
- keep this focused on collaborative sidebar chat only

## Check When Done

- Sidebar subscribes to the `ai-chat` feed.
- Users can send chat messages through the existing sidebar input.
- Chat messages are validated before rendering.
- `ai-chat` remains separate from `ai-status-feed`.
- `npm run build` passes.
