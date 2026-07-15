Add sharing to the workspace so project owners can invite collaborators by email.

## Share Dialog

Add a `Share` button to the editor navbar that opens the share dialog.

Owners can:

- invite collaborators by email
- view current collaborators
- remove collaborators
- copy the project link with temporary `Copied!` feedback

Collaborators can:

- view the collaborator list only
- not invite, remove, or manage access

## Clerk User Data

Collaborators are stored by email in the database.

Use Clerk Backend API to enrich collaborator emails with:

- display name
- avatar image

If a Clerk user is not found for an email, fall back to showing the email only.

## Implementation

Add the required API logic for:

- listing collaborators
- inviting collaborators
- removing collaborators

Enforce ownership server-side for invite and remove actions.

Do not add a local user table.

## Check When Done

- share dialog opens from the workspace
- owners can invite and remove collaborators
- collaborators see read-only access
- collaborator names/avatars load from Clerk when available
- `npm run build` passes
