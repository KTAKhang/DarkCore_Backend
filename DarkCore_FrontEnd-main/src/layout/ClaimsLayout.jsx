import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import Sidebar from "../components/Sidebar/Sidebar";

const ClaimLayout = () => {
    const [isOpen, setIsOpen] = useState(true);

    const toggleSidebar = () => {
        setIsOpen((prev) => !prev);
    };

    return (
        <div>
            <Navbar toggleSidebar={toggleSidebar} />
            <div className="flex">
                <Sidebar isClaimer={true} isOpen={isOpen} />
                <div className="flex-1 p-4">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default ClaimLayout;
