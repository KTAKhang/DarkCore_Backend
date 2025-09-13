import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Phone, Home, Key, ArrowLeft, CheckCircle, Send } from 'lucide-react';
import {
    registerSendOTPRequest,
    clearAuthMessages,
    registerConfirmOTPRequest
} from '../redux/actions/authActions';
import { toast } from 'react-toastify';

const Register = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const {
        registerLoading,
        registerMessage,
        registerError,
        confirmOtpLoading,
        confirmOtpMessage,
        confirmRegisterSuccess,
        confirmOtpError
    } = useSelector(state => state.auth);

    const [step, setStep] = useState(1); // 1: Nhập thông tin, 2: Nhập OTP
    const [formData, setFormData] = useState({
        user_name: '',
        email: '',
        password: '',
        phone: '',
        address: '',
        otp: ''
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        dispatch(clearAuthMessages());
        return () => {
            dispatch(clearAuthMessages());
        };
    }, [dispatch]);
    useEffect(() => {
        if (confirmRegisterSuccess) {

            setTimeout(() => {
                navigate('/');
            }, 1000);
        }
    }, [confirmRegisterSuccess, navigate]);

    useEffect(() => {
        if (registerMessage && step === 1) {
            toast.success(registerMessage);
            setStep(2);
        }
    }, [registerMessage, step]);

    useEffect(() => {
        if (confirmOtpMessage) {
            toast.success('Đăng ký thành công! Đang chuyển về trang đăng nhập...');
            setTimeout(() => {
                navigate('/');
            }, 2000);
        }
    }, [confirmOtpMessage, navigate]);

    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const validatePassword = (password) => password.length >= 6;

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleSendOTP = (e) => {
        e.preventDefault();

        const newErrors = {};
        if (!formData.user_name) newErrors.user_name = 'Vui lòng nhập tên';
        if (!formData.email) newErrors.email = 'Vui lòng nhập email';
        else if (!validateEmail(formData.email)) newErrors.email = 'Email không hợp lệ';
        if (!formData.password) newErrors.password = 'Vui lòng nhập mật khẩu';
        else if (!validatePassword(formData.password)) newErrors.password = 'Mật khẩu ít nhất 6 ký tự';
        if (!formData.phone) newErrors.phone = 'Vui lòng nhập số điện thoại';
        if (!formData.address) newErrors.address = 'Vui lòng nhập địa chỉ';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        dispatch(registerSendOTPRequest(formData));
    };

    const handleConfirmOTP = (e) => {
        e.preventDefault();

        const newErrors = {};
        if (!formData.otp) newErrors.otp = 'Vui lòng nhập mã OTP';
        else if (formData.otp.length !== 6) newErrors.otp = 'OTP phải có 6 số';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        dispatch(registerConfirmOTPRequest({ otp: formData.otp }));
    };

    const handleBackToStep1 = () => {
        setStep(1);
        setFormData(prev => ({ ...prev, otp: '' }));
        setErrors({});
        dispatch(clearAuthMessages());
    };

    return (
        <div
            className="min-h-screen w-full flex items-center justify-center relative overflow-hidden px-4"
            style={{ background: 'linear-gradient(135deg, #0D364C 0%, #13C2C2 100%)' }}
        >
            {/* Card */}
            <div className="relative z-10 w-full max-w-2xl p-6 sm:p-8">
                <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">

                    <Link
                        to="/login"
                        className="inline-flex items-center text-white/80 hover:text-white mb-6"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Quay lại đăng nhập
                    </Link>

                    <div className="text-center mb-8">
                        <div
                            className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #13C2C2 0%, #0D364C 100%)' }}
                        >
                            {step === 1 ? (
                                <User className="w-10 h-10 text-white" />
                            ) : (
                                <Key className="w-10 h-10 text-white" />
                            )}
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            {step === 1 ? 'Đăng Ký' : 'Xác Nhận OTP'}
                        </h1>
                        <p className="text-gray-300">
                            {step === 1
                                ? 'Nhập thông tin để tạo tài khoản'
                                : 'Nhập mã OTP đã được gửi đến email'}
                        </p>
                    </div>

                    {registerError && (
                        <p className="text-red-300 text-center mb-4">{registerError}</p>
                    )}
                    {confirmOtpError && (
                        <p className="text-red-300 text-center mb-4">{confirmOtpError}</p>
                    )}

                    {/* Step 1 */}
                    {step === 1 && (
                        <form onSubmit={handleSendOTP} className="space-y-4">
                            {/* User name */}
                            <InputField
                                icon={<User />}
                                placeholder="Tên người dùng"
                                value={formData.user_name}
                                onChange={(e) => handleInputChange('user_name', e.target.value)}
                                error={errors.user_name}
                            />
                            {/* Email */}
                            <InputField
                                icon={<Mail />}
                                type="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                error={errors.email}
                            />
                            {/* Password */}
                            <InputField
                                icon={<Lock />}
                                type="password"
                                placeholder="Mật khẩu"
                                value={formData.password}
                                onChange={(e) => handleInputChange('password', e.target.value)}
                                error={errors.password}
                            />
                            {/* Phone */}
                            <InputField
                                icon={<Phone />}
                                placeholder="Số điện thoại"
                                value={formData.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                error={errors.phone}
                            />
                            {/* Address */}
                            <InputField
                                icon={<Home />}
                                placeholder="Địa chỉ"
                                value={formData.address}
                                onChange={(e) => handleInputChange('address', e.target.value)}
                                error={errors.address}
                            />

                            <SubmitButton
                                loading={registerLoading}
                                text="Gửi mã OTP"
                                loadingText="Đang gửi..."
                            />
                        </form>
                    )}

                    {/* Step 2 */}
                    {step === 2 && (
                        <form onSubmit={handleConfirmOTP} className="space-y-6">
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                <p className="text-sm text-gray-300">Mã OTP đã gửi đến:</p>
                                <p className="text-white font-medium">{formData.email}</p>
                            </div>

                            <InputField
                                icon={<Key />}
                                placeholder="Nhập OTP (6 số)"
                                value={formData.otp}
                                onChange={(e) =>
                                    handleInputChange(
                                        'otp',
                                        e.target.value.replace(/\D/g, '').slice(0, 6)
                                    )
                                }
                                error={errors.otp}
                            />

                            <SubmitButton
                                loading={confirmOtpLoading}
                                text="Xác nhận OTP"
                                loadingText="Đang xác nhận..."
                            />

                            <button
                                type="button"
                                onClick={handleBackToStep1}
                                className="w-full text-white/80 hover:text-white py-3 px-6 rounded-2xl border border-white/20 transition"
                            >
                                Gửi lại thông tin
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>

    );
};

// Input field component
const InputField = ({ icon, type = "text", placeholder, value, onChange, error }) => (
    <div>
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                {icon}
            </div>
            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className={`w-full pl-12 pr-4 py-4 bg-white/5 border rounded-2xl text-white placeholder-gray-400 
                focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 hover:bg-white/10 
                ${error ? 'border-red-500/50' : 'border-white/20'}`}
            />
        </div>
        {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
    </div>
);

// Submit button component
const SubmitButton = ({ loading, text, loadingText }) => (
    <button
        type="submit"
        disabled={loading}
        className="w-full relative overflow-hidden text-white font-bold py-4 px-6 rounded-2xl 
        transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 disabled:opacity-50"
        style={{
            background: `linear-gradient(135deg, #13C2C2 0%, #0D364C 100%)`,
            boxShadow: `0 0 20px rgba(19, 194, 194, 0.3)`
        }}
    >
        {loading ? (
            <div className="flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {loadingText}
            </div>
        ) : (
            text
        )}
    </button>
);

export default Register;
