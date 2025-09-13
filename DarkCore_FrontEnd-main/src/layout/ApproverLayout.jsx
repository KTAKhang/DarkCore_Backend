import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import Sidebar from "../components/Sidebar/Sidebar"; // Sidebar component

const ApproverLayout = () => {
  const [isOpen, setIsOpen] = useState(true); // State to manage sidebar open/close

  const toggleSidebar = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div>
      <Navbar toggleSidebar={toggleSidebar} />
      <div className="flex">
        <Sidebar isApprover={true} isOpen={isOpen} />
        <div className="flex-1 p-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default ApproverLayout;
