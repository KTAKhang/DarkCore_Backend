import AllRoutes from "./components/AllRoutes";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "./contexts/AuthContext";

export default function App() {
  return (
    <AuthProvider>
      <AllRoutes />
      <ToastContainer />
    </AuthProvider>
  );
}
