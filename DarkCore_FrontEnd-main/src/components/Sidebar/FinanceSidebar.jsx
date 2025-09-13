import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaHome, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { GoProjectRoadmap } from "react-icons/go";
import { HiUserGroup } from "react-icons/hi";
import { FaCheckCircle, FaMoneyCheckAlt } from "react-icons/fa";
const FinanceSidebar = ({ isOpen }) => {
    const [isClaimsOpen, setIsClaimsOpen] = useState(false);

    const toggleClaimsDropdown = () => {
        setIsClaimsOpen(!isClaimsOpen);
    };

    const menuFinanceItems = [
        { name: "Dashboard", path: "/finance", icon: <FaHome /> },
    ];

    const claimsItems = [
        { name: "Approved", path: "/finance/approved", icon: <FaCheckCircle /> },
        { name: "Paid", path: "/finance/paid", icon: <FaMoneyCheckAlt /> },
    ];

    return (
        <div
            className={`h-screen bg-white shadow-lg text-white transition-all duration-300 ${isOpen ? "w-64" : "w-16 flex items-center"
                } flex flex-col`}
        >
            <ul className="mt-4 space-y-2">
                {/* Render menu chính */}
                {menuFinanceItems.map((item, index) => (
                    <li key={index} className="hover:shadow-lg p-2 rounded-md">
                        <Link to={item.path} className="flex items-center space-x-3">
                            <span className="text-xl text-black">{item.icon}</span>
                            {isOpen && <span className="text-black">{item.name}</span>}
                        </Link>
                    </li>
                ))}

                {/* Dropdown Claims nhưng các mục con sẽ nằm thẳng hàng */}
                <li className="p-2 rounded-md hover:shadow-lg">
                    <button
                        onClick={toggleClaimsDropdown}
                        className="flex items-center w-full space-x-3 text-black"
                    >
                        <span className="text-xl">
                            {isClaimsOpen ? <FaChevronUp /> : <FaChevronDown />}
                        </span>
                        {isOpen && <span className="text-black">Claims</span>}
                    </button>
                </li>

                {/* Hiển thị Claims Items ngay sau Claims, không bị thụt vào */}
                {isClaimsOpen &&
                    claimsItems.map((item, index) => (
                        <li key={index} className="hover:shadow-lg p-2 rounded-md">
                            <Link to={item.path} className="flex items-center space-x-3">
                                <span className="text-xl text-black">{item.icon}</span>
                                {isOpen && <span className="text-black">{item.name}</span>}
                            </Link>
                        </li>
                    ))}
            </ul>
        </div>
    );
};

export default FinanceSidebar;
