import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header/Header';
// Product data
const products = [
  {
    id: 1,
    name: "MacBook Pro M3 14 inch",
    price: 52990000,
    originalPrice: 59990000,
    discount: 12,
    rating: 4.8,
    reviews: 124,
    image: "https://cdn2.cellphones.com.vn/x/media/catalog/product/t/e/text_ng_n_3__8_97_1.png?_gl=1*apgeb1*_gcl_aw*R0NMLjE3NTc2NjA2MTEuQ2p3S0NBandpWV9HQmhCRUVpd0FGYWdodmk3OFpYeTd2YzFhLU1nQ1Znb2hnaTNaNTNfdlk5ektoRHQ2MXZfcU1CS1dmclIyQ2VjbmpSb0M1TFFRQXZEX0J3RQ..*_gcl_au*ODU3MjE3NDQuMTc1NzY2MDYxMA..*_ga*MTIyNDM0ODEyMC4xNjY4OTQ3MjM3*_ga_QLK8WFHNK9*czE3NTc2NjA2MTAkbzE1JGcxJHQxNzU3NjYwNjE0JGo1NiRsMCRoMTU0NjQ3NDM1NQ..",
    tags: ["Chip M3", "16GB RAM", "512GB SSD"],
    badges: ["Mới nhất"],
    category: "laptops"
  },
  {
    id: 2,
    name: "iPad Pro 12.9 inch M2",
    price: 28990000,
    originalPrice: 32990000,
    discount: 12,
    rating: 4.9,
    reviews: 89,
    image: "https://cdn2.cellphones.com.vn/x/media/catalog/product/t/e/text_ng_n_3__8_97_1.png?_gl=1*apgeb1*_gcl_aw*R0NMLjE3NTc2NjA2MTEuQ2p3S0NBandpWV9HQmhCRUVpd0FGYWdodmk3OFpYeTd2YzFhLU1nQ1Znb2hnaTNaNTNfdlk5ektoRHQ2MXZfcU1CS1dmclIyQ2VjbmpSb0M1TFFRQXZEX0J3RQ..*_gcl_au*ODU3MjE3NDQuMTc1NzY2MDYxMA..*_ga*MTIyNDM0ODEyMC4xNjY4OTQ3MjM3*_ga_QLK8WFHNK9*czE3NTc2NjA2MTAkbzE1JGcxJHQxNzU3NjYwNjE0JGo1NiRsMCRoMTU0NjQ3NDM1NQ..",
    tags: ["Chip M2", "Liquid Retina XDR", "Hỗ trợ Apple Pencil"],
    badges: ["Bán chạy"],
    category: "tablets"
  },
  {
    id: 3,
    name: "ASUS ROG Strix G15",
    price: 25990000,
    originalPrice: 29990000,
    discount: 13,
    rating: 4.7,
    reviews: 156,
    image: "https://cdn2.cellphones.com.vn/x/media/catalog/product/t/e/text_ng_n_3__8_97_1.png?_gl=1*apgeb1*_gcl_aw*R0NMLjE3NTc2NjA2MTEuQ2p3S0NBandpWV9HQmhCRUVpd0FGYWdodmk3OFpYeTd2YzFhLU1nQ1Znb2hnaTNaNTNfdlk5ektoRHQ2MXZfcU1CS1dmclIyQ2VjbmpSb0M1TFFRQXZEX0J3RQ..*_gcl_au*ODU3MjE3NDQuMTc1NzY2MDYxMA..*_ga*MTIyNDM0ODEyMC4xNjY4OTQ3MjM3*_ga_QLK8WFHNK9*czE3NTc2NjA2MTAkbzE1JGcxJHQxNzU3NjYwNjE0JGo1NiRsMCRoMTU0NjQ3NDM1NQ..",
    tags: ["RTX 4060", "AMD Ryzen 7", "16GB DDR5"],
    badges: ["Gaming"],
    category: "laptops"
  },
  {
    id: 4,
    name: "Dell XPS 13 Plus",
    price: 32990000,
    originalPrice: 36990000,
    discount: 11,
    rating: 4.6,
    reviews: 78,
    image: "https://cdn2.cellphones.com.vn/x/media/catalog/product/t/e/text_ng_n_3__8_97_1.png?_gl=1*apgeb1*_gcl_aw*R0NMLjE3NTc2NjA2MTEuQ2p3S0NBandpWV9HQmhCRUVpd0FGYWdodmk3OFpYeTd2YzFhLU1nQ1Znb2hnaTNaNTNfdlk5ektoRHQ2MXZfcU1CS1dmclIyQ2VjbmpSb0M1TFFRQXZEX0J3RQ..*_gcl_au*ODU3MjE3NDQuMTc1NzY2MDYxMA..*_ga*MTIyNDM0ODEyMC4xNjY4OTQ3MjM3*_ga_QLK8WFHNK9*czE3NTc2NjA2MTAkbzE1JGcxJHQxNzU3NjYwNjE0JGo1NiRsMCRoMTU0NjQ3NDM1NQ..",
    tags: ["Intel i7-1360P", "13.4\" OLED", "512GB SSD"],
    badges: ["Cao cấp"],
    category: "laptops"
  }
];

// Service data
const services = [
  {
    id: 1,
    title: "Sửa chữa laptop",
    description: "Chẩn đoán và sửa chữa mọi sự cố laptop nhanh chóng",
    image: "https://giatin.com.vn/wp-content/uploads/2019/11/sua-laptop-tai-da-nang.jpg",
    icon: "💻",
    services: ["Thay màn hình", "Sửa bàn phím", "Thay pin", "Làm sạch quạt tản nhiệt"],
    priceFrom: "200.000₫",
    duration: "1-3 ngày"
  },
  {
    id: 2,
    title: "Thay màn hình",
    description: "Thay thế màn hình laptop, tablet chất lượng cao",
    image: "https://giatin.com.vn/wp-content/uploads/2019/11/sua-laptop-tai-da-nang.jpg",
    icon: "📺",
    services: ["Màn hình chính hãng", "Bảo hành 6 tháng", "Test kỹ trước giao", "Hỗ trợ tận nhà"],
    priceFrom: "1.500.000₫",
    duration: "2-4 giờ"
  },
  {
    id: 3,
    title: "Nâng cấp phần cứng",
    description: "Nâng cấp RAM, SSD, ổ cứng để tăng hiệu suất",
    image: "https://giatin.com.vn/wp-content/uploads/2019/11/sua-laptop-tai-da-nang.jpg",
    icon: "🔧",
    services: ["Tư vấn miễn phí", "Linh kiện chính hãng", "Tối ưu hiệu suất", "Backup dữ liệu"],
    priceFrom: "500.000₫",
    duration: "1-2 giờ"
  },
  {
    id: 4,
    title: "Vệ sinh laptop",
    description: "Làm sạch bụi bẩn, thay keo tản nhiệt chuyên nghiệp",
    image: "https://giatin.com.vn/wp-content/uploads/2019/11/sua-laptop-tai-da-nang.jpg",
    icon: "🧹",
    services: ["Vệ sinh toàn diện", "Thay keo tản nhiệt", "Kiểm tra quạt", "Tối ưu nhiệt độ"],
    priceFrom: "300.000₫",
    duration: "2-3 giờ"
  }
];

// Categories data
const categories = [
  {
    id: "laptops",
    name: "Laptop",
    description: "Laptop gaming, văn phòng, đồ họa",
    icon: "💻",
    productCount: "150+",
    image: "https://cdn2.cellphones.com.vn/x/media/catalog/product/t/e/text_ng_n_3__8_97_1.png?_gl=1*apgeb1*_gcl_aw*R0NMLjE3NTc2NjA2MTEuQ2p3S0NBandpWV9HQmhCRUVpd0FGYWdodmk3OFpYeTd2YzFhLU1nQ1Znb2hnaTNaNTNfdlk5ektoRHQ2MXZfcU1CS1dmclIyQ2VjbmpSb0M1TFFRQXZEX0J3RQ..*_gcl_au*ODU3MjE3NDQuMTc1NzY2MDYxMA..*_ga*MTIyNDM0ODEyMC4xNjY4OTQ3MjM3*_ga_QLK8WFHNK9*czE3NTc2NjA2MTAkbzE1JGcxJHQxNzU3NjYwNjE0JGo1NiRsMCRoMTU0NjQ3NDM1NQ.."
  },
  {
    id: "tablets",
    name: "Máy tính bảng",
    description: "iPad, Android tablet, Windows tablet",
    icon: "📱",
    productCount: "80+",
    image: "https://cdn2.fptshop.com.vn/unsafe/750x0/filters:format(webp):quality(75)/i_Pad_A16_Wi_Fi_Blue_PDP_Image_Position_1_VN_VI_7db84c95a3.jpg"
  },
  {
    id: "accessories",
    name: "Phụ kiện",
    description: "Chuột, bàn phím, tai nghe, sạc",
    icon: "🎧",
    productCount: "200+",
    image: "https://cdn2.fptshop.com.vn/unsafe/750x0/filters:format(webp):quality(75)/airpods_pro_3_1_c24b2a2c9b.png"
  },
  {
    id: "repair",
    name: "Sửa chữa",
    description: "Sửa laptop, thay màn hình, nâng cấp",
    icon: "🔧",
    productCount: "Dịch vụ 24/7",
    image: "https://giatin.com.vn/wp-content/uploads/2019/11/sua-laptop-tai-da-nang.jpg"
  }
];

const HomePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cartItems, setCartItems] = useState(3);
  const [wishlist, setWishlist] = useState([]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price) + '₫';
  };

  const toggleWishlist = (productId) => {
    setWishlist(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const addToCart = (productId) => {
    setCartItems(prev => prev + 1);
    // Add cart logic here
  };

  const StarRating = ({ rating }) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <span key={i} className={`text-sm ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`}>
            ★
          </span>
        ))}
      </div>
    );
  };

  const ProductCard = ({ product }) => (
    <div className="group bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300 overflow-hidden">
      <div className="relative">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3">
          <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
            -{product.discount}%
          </span>
        </div>
        {product.badges.map((badge, index) => (
          <div key={index} className="absolute top-3 right-3">
            <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-bold">
              {badge}
            </span>
          </div>
        ))}
        <button
          onClick={() => toggleWishlist(product.id)}
          className="absolute bottom-3 right-3 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-red-50 transition-colors"
        >
          <span className={`text-lg ${wishlist.includes(product.id) ? 'text-red-500' : 'text-gray-600'}`}>
            {wishlist.includes(product.id) ? '❤️' : '🤍'}
          </span>
        </button>
      </div>
      <div className="p-5">
        <h3 className="font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
          {product.name}
        </h3>
        <div className="flex flex-wrap gap-1 mb-3">
          {product.tags.map((tag, index) => (
            <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center mb-3">
          <StarRating rating={product.rating} />
          <span className="text-sm text-gray-500 ml-2">
            {product.rating} ({product.reviews})
          </span>
        </div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-lg font-bold text-red-600">
              {formatPrice(product.price)}
            </span>
            <span className="text-sm text-gray-400 line-through ml-2">
              {formatPrice(product.originalPrice)}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => addToCart(product.id)}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Thêm giỏ hàng
          </button>
          <button className="flex-1 border border-blue-600 text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium">
            Xem chi tiết
          </button>
        </div>
      </div>
    </div>
  );

  const ServiceCard = ({ service }) => (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group">
      <div className="relative h-40 overflow-hidden">
        <img
          src={service.image}
          alt={service.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center">
          <span className="text-xl">{service.icon}</span>
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{service.title}</h3>
        <p className="text-gray-600 text-sm mb-4 leading-relaxed">{service.description}</p>
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2 text-sm">Dịch vụ bao gồm:</h4>
          <ul className="space-y-1">
            {service.services.map((item, index) => (
              <li key={index} className="flex items-center text-sm text-gray-600">
                <span className="text-green-500 text-xs mr-2">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center justify-between mb-4 text-sm">
          <div>
            <span className="text-gray-500">Giá từ:</span>
            <span className="font-bold text-blue-600 ml-1">{service.priceFrom}</span>
          </div>
          <div>
            <span className="text-gray-500">Thời gian:</span>
            <span className="font-medium text-gray-900 ml-1">{service.duration}</span>
          </div>
        </div>
        <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
          Đặt lịch sửa chữa
        </button>
      </div>
    </div>
  );

  const CategoryCard = ({ category }) => (
    <div className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer">
      <div className="relative h-48 overflow-hidden">
        <img
          src={category.image}
          alt={category.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-4 left-4 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center">
          <span className="text-xl">{category.icon}</span>
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
          {category.name}
        </h3>
        <p className="text-gray-600 text-sm mb-3 leading-relaxed">{category.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-blue-600 font-medium text-sm">{category.productCount} sản phẩm</span>
          <span className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all">
            →
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header searchTerm={searchTerm} setSearchTerm={setSearchTerm} cartItems={cartItems} />

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-blue-600 to-purple-700 overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
            style={{ backgroundImage: "url('https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/2022_8_16_637962581110697805_cong-nghe-man-hinh-laptop-a.jpg')" }}></div>
          <div className="relative container mx-auto px-4 py-20">
            <div className="max-w-3xl">
              <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
                Công nghệ hàng đầu<br />
                <span className="text-yellow-300">cho cuộc sống hiện đại</span>
              </h1>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                Khám phá bộ sưu tập laptop, máy tính bảng và thiết bị công nghệ mới nhất với giá tốt nhất.
                Chúng tôi cũng cung cấp dịch vụ sửa chữa chuyên nghiệp.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="bg-white text-blue-600 px-8 py-4 rounded-full font-bold hover:bg-blue-50 transition-colors text-center">
                  Xem sản phẩm
                </button>
                <button className="border-2 border-white text-white px-8 py-4 rounded-full font-bold hover:bg-white hover:text-blue-600 transition-colors text-center">
                  Dịch vụ sửa chữa
                </button>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent"></div>
        </section>

        {/* Categories Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Danh mục sản phẩm</h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Khám phá các danh mục sản phẩm công nghệ hàng đầu với chất lượng đảm bảo
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map(category => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Sản phẩm nổi bật</h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Những sản phẩm công nghệ hàng đầu được khách hàng yêu thích nhất
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="text-center">
              <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                Xem tất cả sản phẩm
              </button>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Dịch vụ sửa chữa</h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Dịch vụ sửa chữa laptop chuyên nghiệp với đội ngũ kỹ thuật viên giàu kinh nghiệm
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {services.map(service => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
            <div className="text-center">
              <div className="bg-blue-50 rounded-2xl p-8 mb-8">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-2xl">📞</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Hỗ trợ 24/7</h3>
                <p className="text-gray-600 mb-4 max-w-md mx-auto">
                  Liên hệ ngay với chúng tôi để được tư vấn và hỗ trợ kỹ thuật miễn phí
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    Liên hệ ngay
                  </button>
                  <a href="tel:0123456789" className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors font-medium">
                    Gọi: 0123.456.789
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl">💻</span>
                </div>
                <span className="text-xl font-bold">TechStore</span>
              </div>
              <p className="text-gray-400 mb-4 leading-relaxed">
                Chuyên cung cấp laptop, máy tính bảng và dịch vụ sửa chữa chất lượng cao với giá cả hợp lý.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors">
                  📘
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors">
                  📺
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors">
                  📷
                </a>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Sản phẩm</h3>
              <ul className="space-y-2">
                <li><a className="text-gray-400 hover:text-white transition-colors cursor-pointer">Laptop</a></li>
                <li><a className="text-gray-400 hover:text-white transition-colors cursor-pointer">Máy tính bảng</a></li>
                <li><a className="text-gray-400 hover:text-white transition-colors cursor-pointer">Phụ kiện</a></li>
                <li><a className="text-gray-400 hover:text-white transition-colors cursor-pointer">Sản phẩm giảm giá</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Dịch vụ</h3>
              <ul className="space-y-2">
                <li><a className="text-gray-400 hover:text-white transition-colors cursor-pointer">Sửa chữa laptop</a></li>
                <li><a className="text-gray-400 hover:text-white transition-colors cursor-pointer">Thay màn hình</a></li>
                <li><a className="text-gray-400 hover:text-white transition-colors cursor-pointer">Nâng cấp phần cứng</a></li>
                <li><a className="text-gray-400 hover:text-white transition-colors cursor-pointer">Bảo hành</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Liên hệ</h3>
              <ul className="space-y-3">
                <li className="flex items-center text-gray-400">
                  <span className="mr-3 text-blue-400">📍</span>123 Đường ABC, Quận Ninh Kiều, TP.Cần Thơ
                </li>
                <li className="flex items-center text-gray-400">
                  <span className="mr-3 text-blue-400">📞</span>0123.456.789
                </li>
                <li className="flex items-center text-gray-400">
                  <span className="mr-3 text-blue-400">✉️</span>info@techstore.vn
                </li>
                <li className="flex items-center text-gray-400">
                  <span className="mr-3 text-blue-400">⏰</span>8:00 - 22:00 hàng ngày
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>)
}

export default HomePage;