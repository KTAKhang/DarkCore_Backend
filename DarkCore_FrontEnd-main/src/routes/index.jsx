import LoginPage from "../pages/LoginPage";
import ForgotPassword from "../pages/ForgotPassword";
import NotFoundPage from "../pages/NotFoundPage";
import Register from "../pages/Register";
import HomePage from "../pages/HomePage";
import CartPage from "../pages/CartPage";


export const routes = [
  // Trang login (HomePage)
  {
    path: "/",
    element: <HomePage />, // login page
  },
  {
    path: "/login",
    element: <LoginPage />, // login page
  },
  {
    path: "/cart",
    element: <CartPage />, // login page
  },


  // Trang quên mật khẩu
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },

  {
    path: "/register",
    element: <Register />,
  },


  // Trang 404
  {
    path: "*",
    element: <NotFoundPage />,
  },
];
