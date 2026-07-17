Persist generated specs with Vercel Blob and Prisma, then add a secure download route so users can retrieve their generated spec files.

### Implementation

1. ProjectSpec model

Ensure a `ProjectSpec` Prisma model exists with:

- `id`
- `projectId` (relation to Project)
- `filePath` (Blob URL or path)
- `createdAt`

Use this model for metadata only. The actual spec content should live in Vercel Blob.

2. Save generated spec

After a spec is generated:

- upload the Markdown content to Vercel Blob
- store the Blob URL/path in `ProjectSpec.filePath`
- link the record to the correct project
- follow the same metadata + blob pattern used for canvas persistence

3. Download route

Create a route like: `GET /api/projects/[projectId]/specs/[specId]/download`

It should:

- authenticate the user
- verify access to the project
- verify the spec belongs to that project
- fetch the file using `ProjectSpec.filePath`
- return it as a downloadable Markdown file
- handle not found and forbidden cases properly

4. Issues: Bug - after ai generation Notification above shapes tool bar remains constantly

- after generating ai architecture workflow the notification remains constant in the canvas.
- do not show any states in the canvas, only show the cursore editing, thinking features. 
- refer the `image/bottom-notification-bug.png` 

### Scope Limits

- do not add frontend or UI logic
- do not store spec content in Prisma
- do not expose Blob URLs without access checks
- do not modify existing canvas persistence

### Notes

- check `context/project-overview.md` and `context/architecture-context.md` first
- reuse existing project access patterns
- Prisma stores metadata, Vercel Blob stores content

### Check When Done

- `ProjectSpec` model exists with required fields
- spec is uploaded to Vercel Blob
- `filePath` is saved correctly
- download route validates access before returning file
- response is a Markdown attachment
- TypeScript and build pass
