import React from "react";
import { Link } from "react-router-dom";

const Header = ({ searchTerm, setSearchTerm, cartItems }) => {
    return (
        <header className="bg-white shadow-sm border-b border-gray-100">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <a className="flex items-center space-x-2" href="/">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white text-xl">💻</span>
                        </div>
                        <span className="text-xl font-bold text-gray-900">TechStore</span>
                    </a>

                    <nav className="hidden md:flex items-center space-x-8">
                        <a className="text-gray-700 hover:text-blue-600 transition-colors" href="/">Trang chủ</a>
                        <a className="text-gray-700 hover:text-blue-600 transition-colors" href="/products">Sản phẩm</a>
                        <a className="text-gray-700 hover:text-blue-600 transition-colors" href="/repair">Sửa chữa</a>
                        <a className="text-gray-700 hover:text-blue-600 transition-colors" href="/about">Về chúng tôi</a>
                        <a className="text-gray-700 hover:text-blue-600 transition-colors" href="/contact">Liên hệ</a>
                    </nav>

                    <div className="flex items-center space-x-4">
                        <div className="relative transition-all duration-300 w-64">
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm laptop, máy tính bảng..."
                                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-blue-600 transition-colors">
                                <span className="text-lg">🤍</span>
                            </button>
                            <Link to="/cart" className="relative w-10 h-10 flex items-center justify-center text-gray-600 hover:text-blue-600 transition-colors" style={{ color: '#13C2C2' }}>
                                <span className="text-lg">🛒</span>
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                    {cartItems}
                                </span>
                            </Link>

                            <Link to="/login" className="relative w-10 h-10 flex items-center justify-center text-gray-600 hover:text-blue-600 transition-colors" style={{ color: '#13C2C2' }}>
                                <span className="text-lg">👤</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
