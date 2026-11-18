import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Public routes — sign-in and sign-up env vars are read by Clerk directly.
const isPublicRoute = createRouteMatcher([
  "/get-started(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);
const isApiRoute = createRouteMatcher(["/api(.*)", "/trpc(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // API handlers return JSON 401/403 responses themselves. Clerk's default
  // protection redirect would turn unauthenticated API calls into HTML 200s.
  if (!isPublicRoute(req) && !isApiRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
