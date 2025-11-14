const nodemailer = require('nodemailer');

// Lazy load transporter to ensure .env is loaded first
let transporter = null;

const getTransporter = () => {
	if (!transporter) {
		// Check environment variables
		if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
			console.error('SMTP environment variables not set!');
			console.error('Required: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS');
			throw new Error('Missing SMTP configuration');
		}

		// Create transporter
		transporter = nodemailer.createTransport({
			host: process.env.SMTP_HOST,
			port: parseInt(process.env.SMTP_PORT) || 465,
			secure: true,
			auth: {
				user: process.env.SMTP_USER,
				pass: process.env.SMTP_PASS
			},
			// Force IPv4
			family: 4
		});
	}
	return transporter;
};

/**
 * Send repair completion email to customer
 * @param {Object} repairRequest - Repair request object
 * @param {Object} user - User object with email
 * @param {Array} services - Array of services with names and prices
 */
const sendRepairCompletionEmail = async (repairRequest, user, services) => {
	try {
		const servicesHTML = services.map(s =>
			`<li>${s.name || s.serviceName}: ${new Intl.NumberFormat('vi-VN').format(s.basePrice)}₫</li>`
		).join('');

		const mailOptions = {
			from: `"DarkCore Computer" <${process.env.SMTP_USER}>`,
			to: user.email,
			subject: 'Thiết bị của bạn đã được sửa chữa xong!',
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
					<div style="background: linear-gradient(135deg, #13C2C2 0%, #0D364C 100%); padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
						<h1 style="color: white; margin: 0;">DarkCore Computer</h1>
						<p style="color: white; margin: 5px 0;">Dịch vụ sửa chữa máy tính</p>
					</div>
					
					<div style="padding: 30px; background-color: #f9f9f9;">
						<h2 style="color: #13C2C2; margin-top: 0;">Chào ${user.user_name || user.email},</h2>
						
						<p style="font-size: 16px; line-height: 1.6; color: #333;">
							Chúng tôi vui mừng thông báo rằng thiết bị của bạn đã được sửa chữa <strong>hoàn tất</strong>!
						</p>
						
						<div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #13C2C2;">
							<h3 style="color: #0D364C; margin-top: 0;">Thông tin thiết bị:</h3>
							<p style="margin: 5px 0;"><strong>Thiết bị:</strong> ${repairRequest.deviceBrand} ${repairRequest.deviceModel}</p>
							<p style="margin: 5px 0;"><strong>Loại:</strong> ${repairRequest.deviceName}</p>
							${repairRequest.serialNumber ? `<p style="margin: 5px 0;"><strong>Serial:</strong> ${repairRequest.serialNumber}</p>` : ''}
						</div>
						
						<div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #52C41A;">
							<h3 style="color: #0D364C; margin-top: 0;">Dịch vụ đã thực hiện:</h3>
							<ul style="margin: 10px 0; padding-left: 20px;">
								${servicesHTML}
							</ul>
							<p style="margin: 15px 0 0 0; font-size: 18px;">
								<strong>Tổng chi phí:</strong> 
								<span style="color: #13C2C2; font-size: 24px;">${new Intl.NumberFormat('vi-VN').format(repairRequest.estimatedCost)}₫</span>
							</p>
						</div>
						
						<div style="background-color: #fff7e6; padding: 15px; border-radius: 8px; margin: 20px 0;">
							<p style="margin: 0; color: #d4380d; font-weight: 500;">
								Lưu ý: Vui lòng mang theo email này khi đến nhận thiết bị.
							</p>
						</div>
						
						<p style="font-size: 16px; line-height: 1.6; color: #333;">
							Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua email này hoặc hotline của chúng tôi.
						</p>
						
						<p style="font-size: 16px; line-height: 1.6; color: #333;">
							Cảm ơn bạn đã tin tưởng sử dụng dịch vụ của DarkCore Computer!
						</p>
					</div>
					
					<div style="background-color: #0D364C; padding: 15px; border-radius: 0 0 10px 10px; text-align: center; color: white;">
						<p style="margin: 5px 0; font-size: 14px;">DarkCore Computer - Chuyên nghiệp • Tận tâm • Uy tín</p>
						<p style="margin: 5px 0; font-size: 12px; color: #13C2C2;">Email này được gửi tự động, vui lòng không trả lời.</p>
					</div>
				</div>
			`
		};

		// Get transporter (lazy loaded)
		const emailTransporter = getTransporter();
		const info = await emailTransporter.sendMail(mailOptions);

		return { success: true, messageId: info.messageId };
	} catch (error) {
		console.error('Error sending email:', error);
		return { success: false, error: error.message };
	}
};

module.exports = {sendRepairCompletionEmail};

