import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  HomeOutlined,
  AppstoreOutlined,
  DatabaseOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  ProfileOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  LogoutOutlined,
  DownOutlined,
  RightOutlined,
  PlusOutlined,
  ProjectOutlined,
  MenuOutlined
} from '@ant-design/icons';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebar } from '../../contexts/SidebarContext';
import PropTypes from 'prop-types';

const Sidebar = ({ isFinance, isAdmin, isApprover, isClaimer }) => {
  const [isClaimsOpen, setIsClaimsOpen] = useState(false);
  const [isWarehouseOpen, setIsWarehouseOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const sidebarContext = useSidebar ? useSidebar() : {};
  const isOpen = typeof sidebarContext.isOpen !== 'undefined' ? sidebarContext.isOpen : (typeof props.isOpen !== 'undefined' ? props.isOpen : true);
  const [hoveredItem, setHoveredItem] = useState(null);

  // Sử dụng useRef để theo dõi trạng thái isOpen trước đó
  const prevIsOpen = useRef(isOpen);

  useEffect(() => {
    // Cập nhật giá trị ref sau mỗi render
    prevIsOpen.current = isOpen;
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };


  const adminMenuItems = [
    {
      title: "Dashboard",
      path: "/admin",
      icon: <HomeOutlined />,
      color: "#FF6B6B"
    },
    {
      title: "Quản Lý Kho",
      icon: <AppstoreOutlined />,
      color: "#96CEB4",
      children: [
        {
          title: "Quản Lý Category",
          path: "/admin/category",
          icon: <AppstoreOutlined />,
          color: "#FECA57"
        },
        {
          title: "Quản Lý Sản Phẩm",
          path: "/admin/product",
          icon: <DatabaseOutlined />,
          color: "#FF9FF3"
        }
      ]
    },
    {
      title: "Quản Lý Khách Hàng",
      path: "/admin/customer",
      icon: <UserOutlined />,
      color: "#54A0FF"
    },
    {
      title: "Quản Lý Đơn Hàng",
      path: "/admin/order",
      icon: <ShoppingCartOutlined />,
      color: "#5F27CD"
    },
    {
      title: "Quản Lý Reviews",
      path: "/admin/review",
      icon: <ProfileOutlined />,
      color: "#FF9F43"
    },
  ];




  const generalMenuItems = [
    {
      title: "Home",
      path: "/",
      icon: <HomeOutlined />,
      color: "#FF6B6B"
    }
  ];

  const renderAdminMenuItems = () => (
    <div className="space-y-2">
      {adminMenuItems.map((item, idx) =>
        !item.children ? (
          <motion.div
            key={idx}
            whileHover={{ scale: 1.02, x: 5 }}
            whileTap={{ scale: 0.98 }}
            onHoverStart={() => setHoveredItem(idx)}
            onHoverEnd={() => setHoveredItem(null)}
          >
            <Link
              to={item.path}
              className={`group relative flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 overflow-hidden ${location.pathname === item.path
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                : 'text-gray-300 hover:bg-gradient-to-r hover:from-gray-700 hover:to-gray-600 hover:text-white'
                }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              <div className={`relative z-10 p-2 rounded-lg transition-colors duration-300`} style={{ backgroundColor: hoveredItem === idx ? `${item.color}20` : 'transparent' }}>
                <span className="text-xl" style={{ color: location.pathname === item.path ? 'white' : item.color }}>{item.icon}</span>
              </div>
              <AnimatePresence>
                {isOpen && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="relative z-10 font-medium"
                  >
                    {item.title}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          </motion.div>
        ) : (
          <div key={idx}>
            <motion.button
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsWarehouseOpen((open) => !open)}
              className={`group relative flex items-center justify-between w-full px-4 py-3.5 rounded-xl transition-all duration-300 overflow-hidden ${location.pathname === item.path
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                : 'text-gray-300 hover:bg-gradient-to-r hover:from-gray-700 hover:to-gray-600 hover:text-white'
                }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              <span className="relative z-10 flex items-center gap-4">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${item.color}20` }}>
                  <span className="text-xl" style={{ color: item.color }}>{item.icon}</span>
                </div>
                <AnimatePresence>
                  {isOpen && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="font-medium"
                    >
                      {item.title}
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: isWarehouseOpen ? 0 : -90 }}
                    exit={{ opacity: 0, rotate: -90 }}
                    className="relative z-10"
                  >
                    <DownOutlined className="text-sm" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
            <AnimatePresence>
              {isWarehouseOpen && isOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="ml-6 mt-2 space-y-1 overflow-hidden"
                >
                  {item.children.map((child, cidx) => (
                    <motion.div
                      key={cidx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: cidx * 0.1 }}
                    >
                      <Link
                        to={child.path}
                        className={`group relative flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-300 overflow-hidden ${location.pathname === child.path
                          ? 'bg-white text-indigo-600 shadow-md transform translate-x-2'
                          : 'text-gray-400 hover:bg-white/10 hover:text-white hover:translate-x-1'
                          }`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
                        <div className="relative z-10 p-1.5 rounded-md" style={{ backgroundColor: `${child.color}15` }}>
                          <span className="text-lg" style={{ color: child.color }}>{child.icon}</span>
                        </div>
                        <span className="relative z-10 font-medium">{child.title}</span>
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      )}
    </div>
  );

  const renderMenuItems = (items) => (
    <div className="space-y-2">
      {items.map((item, index) => (
        <motion.div
          key={index}
          whileHover={{ scale: 1.02, x: 5 }}
          whileTap={{ scale: 0.98 }}
          onHoverStart={() => setHoveredItem(index)}
          onHoverEnd={() => setHoveredItem(null)}
        >
          <Link
            to={item.path}
            className={`group relative flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 overflow-hidden ${location.pathname === item.path
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
              : 'text-gray-300 hover:bg-gradient-to-r hover:from-gray-700 hover:to-gray-600 hover:text-white'
              }`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            <div className={`relative z-10 p-2 rounded-lg transition-colors duration-300`} style={{ backgroundColor: hoveredItem === index ? `${item.color}20` : 'transparent' }}>
              <span className="text-xl" style={{ color: location.pathname === item.path ? 'white' : item.color }}>{item.icon}</span>
            </div>
            <AnimatePresence>
              {isOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="relative z-10 font-medium"
                >
                  {item.title}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </motion.div>
      ))}
    </div>
  );

  const renderClaimsSection = () => (
    <div>
      <motion.button
        whileHover={{ scale: 1.02, x: 5 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsClaimsOpen(!isClaimsOpen)}
        className={`group relative w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 overflow-hidden ${isClaimsOpen
          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
          : 'text-gray-300 hover:bg-gradient-to-r hover:from-gray-700 hover:to-gray-600 hover:text-white'
          }`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-2 rounded-lg bg-blue-500/20">
            <FileTextOutlined className="text-xl text-blue-400" />
          </div>
          <AnimatePresence>
            {isOpen && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-medium"
              >
                Claims
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: isClaimsOpen ? 0 : -90 }}
              exit={{ opacity: 0, rotate: -90 }}
              className="relative z-10"
            >
              <DownOutlined className="text-sm opacity-60" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {isClaimsOpen && isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 ml-6 space-y-1 overflow-hidden"
          >
            {claimsItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={item.path}
                  className={`group relative flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-300 overflow-hidden ${location.pathname === item.path
                    ? 'bg-white text-indigo-600 shadow-md transform translate-x-2'
                    : 'text-gray-400 hover:bg-white/10 hover:text-white hover:translate-x-1'
                    }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
                  <div className="relative z-10 p-1.5 rounded-md" style={{ backgroundColor: `${item.color}15` }}>
                    <span className="text-lg" style={{ color: item.color }}>{item.icon}</span>
                  </div>
                  <span className="relative z-10 font-medium">{item.title}</span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const getMenuItems = () => {
    if (isFinance) {
      return (
        <>
          {renderMenuItems(financeMenuItems)}
          {renderClaimsSection()}
        </>
      );
    } else if (isAdmin) {
      return renderAdminMenuItems();
    } else if (isApprover) {
      return renderMenuItems(approverMenuItems);
    } else if (isClaimer) {
      return renderMenuItems(claimerMenuItems);
    } else {
      return renderMenuItems(generalMenuItems);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={false}
      animate={{
        width: '280px',
        transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
      }}
      className="sticky top-0 z-40 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 min-h-screen text-gray-200 shadow-2xl border-r border-slate-700/50"
    >
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-purple-400/10 to-pink-400/10"></div>
        <motion.div
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%"],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-30"
          style={{
            backgroundSize: "200% 200%",
          }}
        />
      </div>

      <div className="relative z-10 p-4 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center mb-8 pb-4 border-b border-slate-700/50">
          <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
            <AppstoreOutlined className="text-white text-lg" />
          </div>
          <div className="ml-3">
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">Management System</p>
          </div>
        </div>

        {/* Main Menu */}
        <div className="flex-1 flex flex-col justify-between">
          {/* Menu Items Container */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {getMenuItems()}
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

Sidebar.propTypes = {
  isFinance: PropTypes.bool,
  isAdmin: PropTypes.bool,
  isApprover: PropTypes.bool,
  isClaimer: PropTypes.bool,
};

Sidebar.defaultProps = {
  isFinance: false,
  isAdmin: false,
  isApprover: false,
  isClaimer: false,
  isOpen: true
};

export default Sidebar;
