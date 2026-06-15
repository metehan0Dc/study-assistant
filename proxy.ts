import { withAuth } from "next-auth/middleware";

export const proxy = withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/pdfs/:path*",
    "/quiz/:path*",
    "/profile/:path*"
  ]
};
