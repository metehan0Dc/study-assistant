export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/pdfs/:path*",
    "/chat/:path*",
    "/quiz/:path*",
    "/profile/:path*"
  ]
};