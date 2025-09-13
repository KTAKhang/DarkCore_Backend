import React, { useState } from 'react';
import { Minus, Plus, Trash2, ArrowLeft, Shield, Truck, Headphones } from 'lucide-react';
import Header from '../components/Header/Header';

const CartPage = () => {
    const [cartItems, setCartItems] = useState([
        {
            id: 1,
            name: 'MacBook Pro M3 14 inch',
            image: 'https://readdy.ai/api/search-image?query=Apple%20MacBook%20Pro%20laptop%20with%20sleek%20aluminum%20design%20open%20displaying%20colorful%20desktop%20on%20pure%20white%20background%2C%20premium%20product%20photography%20with%20soft%20shadows%20and%20professional%20lighting&width=200&height=200&seq=cart-macbook&orientation=squarish',
            specs: ['Chip M3', '16GB RAM', '512GB SSD'],
            price: 52990000,
            originalPrice: 59990000,
            quantity: 1
        },
        {
            id: 2,
            name: 'iPad Pro 12.9 inch M2',
            image: 'https://readdy.ai/api/search-image?query=iPad%20Pro%20tablet%20device%20with%20vibrant%20display%20showing%20creative%20apps%20interface%20on%20clean%20white%20background%2C%20modern%20product%20photography%20emphasizing%20sleek%20design%20and%20premium%20build&width=200&height=200&seq=cart-ipad&orientation=squarish',
            specs: ['Chip M2', 'Liquid Retina XDR', 'Hỗ trợ Apple Pencil'],
            price: 28990000,
            originalPrice: 32990000,
            quantity: 2
        },
        {
            id: 3,
            name: 'AirPods Pro Gen 2',
            image: 'https://readdy.ai/api/search-image?query=Apple%20AirPods%20Pro%20wireless%20earbuds%20with%20charging%20case%20on%20clean%20white%20background%2C%20premium%20audio%20accessories%20photography%20with%20soft%20shadows%20and%20elegant%20presentation&width=200&height=200&seq=cart-airpods&orientation=squarish',
            specs: ['Chống ồn chủ động', 'Chip H2', 'MagSafe'],
            price: 5990000,
            originalPrice: 6990000,
            quantity: 1
        }
    ]);

    const [searchTerm, setSearchTerm] = useState('');
    const [cartItemQuantity, setCartItemQuantity] = useState(3);
    const [wishlist, setWishlist] = useState([]);
    const [couponCode, setCouponCode] = useState('');

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN').format(price) + '₫';
    };

    const updateQuantity = (id, change) => {
        setCartItems(prevItems =>
            prevItems.map(item =>
                item.id === id
                    ? { ...item, quantity: Math.max(1, item.quantity + change) }
                    : item
            )
        );
    };

    const removeItem = (id) => {
        setCartItems(prevItems => prevItems.filter(item => item.id !== id));
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const calculateSubtotal = () => {
        return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const calculateOriginalTotal = () => {
        return cartItems.reduce((total, item) => total + (item.originalPrice * item.quantity), 0);
    };

    const calculateSavings = () => {
        return calculateOriginalTotal() - calculateSubtotal();
    };

    const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);

    return (
        <>
            <Header searchTerm={searchTerm} setSearchTerm={setSearchTerm} cartItems={cartItemQuantity} />
            <div className="min-h-screen bg-gray-50 py-8">
                {/* Header */}

                <div className="container mx-auto px-4">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Giỏ hàng của bạn</h1>
                        <p className="text-gray-600">{totalItems} sản phẩm trong giỏ hàng</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Products Section */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-gray-100">
                                    <h2 className="text-xl font-bold text-gray-900">Sản phẩm</h2>
                                </div>

                                <div className="divide-y divide-gray-100">
                                    {cartItems.map((item) => (
                                        <div key={item.id} className="p-6">
                                            <div className="flex items-start gap-4">
                                                <div className="flex-shrink-0">
                                                    <img
                                                        alt={item.name}
                                                        className="w-20 h-20 object-cover rounded-lg"
                                                        src={item.image}
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-gray-900 mb-2">{item.name}</h3>
                                                    <div className="flex flex-wrap gap-1 mb-3">
                                                        {item.specs.map((spec, index) => (
                                                            <span
                                                                key={index}
                                                                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                                                            >
                                                                {spec}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex items-center border border-gray-200 rounded-lg">
                                                                <button
                                                                    onClick={() => updateQuantity(item.id, -1)}
                                                                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
                                                                >
                                                                    <Minus className="w-4 h-4 text-gray-600" />
                                                                </button>
                                                                <span className="w-12 text-center font-medium">
                                                                    {item.quantity}
                                                                </span>
                                                                <button
                                                                    onClick={() => updateQuantity(item.id, 1)}
                                                                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
                                                                >
                                                                    <Plus className="w-4 h-4 text-gray-600" />
                                                                </button>
                                                            </div>
                                                            <button
                                                                onClick={() => removeItem(item.id)}
                                                                className="w-10 h-10 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-bold text-red-600 text-lg">
                                                                {formatPrice(item.price * item.quantity)}
                                                            </div>
                                                            <div className="text-sm text-gray-400 line-through">
                                                                {formatPrice(item.originalPrice * item.quantity)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-6 flex justify-between">
                                <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors">
                                    <ArrowLeft className="w-4 h-4" />
                                    Tiếp tục mua sắm
                                </button>
                                <button
                                    onClick={clearCart}
                                    className="flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Xóa tất cả
                                </button>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Tổng kết đơn hàng</h2>

                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Tạm tính:</span>
                                        <span className="font-medium">{formatPrice(calculateSubtotal())}</span>
                                    </div>
                                    <div className="flex justify-between text-green-600">
                                        <span>Tiết kiệm:</span>
                                        <span className="font-medium">-{formatPrice(calculateSavings())}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Phí vận chuyển:</span>
                                        <span className="font-medium">Miễn phí</span>
                                    </div>
                                    <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg flex items-center">
                                        <Truck className="w-4 h-4 mr-2" />
                                        Miễn phí vận chuyển cho đơn hàng trên 50 triệu
                                    </div>
                                    <div className="border-t border-gray-200 pt-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-lg font-bold text-gray-900">Tổng cộng:</span>
                                            <span className="text-2xl font-bold text-red-600">
                                                {formatPrice(calculateSubtotal())}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <button className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 transition-colors font-bold">
                                        Thanh toán ngay
                                    </button>
                                    <button className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                                        Mua trước trả sau
                                    </button>
                                </div>

                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <h3 className="font-bold text-gray-900 mb-3">Ưu đãi & Khuyến mãi</h3>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Nhập mã giảm giá"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value)}
                                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                        />
                                        <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium whitespace-nowrap">
                                            Áp dụng
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <Shield className="w-4 h-4 text-green-500" />
                                        <span>Bảo hành chính hãng</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600 mt-2">
                                        <Truck className="w-4 h-4 text-blue-500" />
                                        <span>Giao hàng toàn quốc</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600 mt-2">
                                        <Headphones className="w-4 h-4 text-purple-500" />
                                        <span>Hỗ trợ 24/7</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>


    );
};

export default CartPage;