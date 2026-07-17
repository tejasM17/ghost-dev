Fix All The Following Issues :

## Sahred Project issue:
- When the owner try to invite the collaborator the invitation is failing, 
- after refreshing the error is gone, but at the collaborator's dashboard project is not opening with the same `project_id` of woner's `project_id`
- then Try to open the same project in collaborator's dashboard also fasing with some errors. 

## Editing, Deleteing Project issue:
- Reade `project-sidebar.tsx`. When the user try to edit the project's Name or to delete the project.. istade of showing  the potions to edit or delete, It's loading the project's canvas 
- fix it: canvas do not load when click the 3 dot button. only shows the options to edit or deleate the project

# Tips to fix the issues:
- All the reqired `liveblocks-skills` and `clerk-skills` avilable at `.agents/skills/` or `.claude/skills/` also use the skills to fix this issue

### Error after inviting the collaborator :

```
## Error Type
Runtime TypeError

## Error Message
collaborator.createdAt.toISOString is not a function


    at useShareDialog.useCallback[submitInvite] (hooks/use-share-dialog.ts:76:64)
    at useShareDialog (hooks/use-share-dialog.ts:13:53)
    at WorkspaceShell (components/editor/workspace-shell.tsx:52:37)
    at EditorRoomPage (app/editor/[roomId]/page.tsx:59:5)

## Code Frame
  74 |         setCollaborators((current) => [
  75 |           ...current,
> 76 |           { ...collaborator, createdAt: collaborator.createdAt.toISOString() },
     |                                                                ^
  77 |         ]);
  78 |         setInviteEmail("");
  79 |       });

Next.js version: 16.2.10 (Turbopack)
```

### Error during opening the same project in collaboorator's dashboard:

- Error 1:

```
## Error Type
Console Error

## Error Message
[Liveblocks "You have no access to this room"

Next.js version: 16.2.10 (Turbopack)
```

- Error 2:

```
## Error Type
Console Error

## Error Message
[Liveblocks "Connection to websocket server closed. Reason: You have no access to this room (code: 4001)."

Next.js version: 16.2.10 (Turbopack)
```

## Check When Done

- Owner can create new project, edit project, delete project.
- owner can send invitations to single or multiple collaborators with Zero Errors.
- At collaborator's Shared projects load cleanly without any Errors.
