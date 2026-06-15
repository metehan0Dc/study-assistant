import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/pdfs/:path*",
    "/chat/:path*",
    "/quiz/:path*",
    "/profile/:path*"
  ]
};
