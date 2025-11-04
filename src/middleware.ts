import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoutes = createRouteMatcher([
    '/', //public route - landing page
    '/sign-in',
    '/sign-up',
    '/policies',
    '/privacy-policy',
    '/terms-and-conditions',
    '/terms-of-use'
])


export default clerkMiddleware(async (auth, req) => {
    if (!isPublicRoutes(req)) {
        await auth.protect({
            unauthenticatedUrl: `${req.nextUrl.origin}/sign-in`,
        });
    }
    return NextResponse.next()
})

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};