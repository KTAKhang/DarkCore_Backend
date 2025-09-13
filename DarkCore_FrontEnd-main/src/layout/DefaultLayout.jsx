import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import Sidebar from "../components/Sidebar/Sidebar";

function DefaultLayout() {
  return (
    <>
      <Outlet />
    </>
  );
}

export default DefaultLayout;
