export const authPageMessages = {
    brand: 'MoneyCare',
    divider: 'hoặc',
    emailLabel: 'Email',
    emailPlaceholder: 'you@example.com',
    googleButton: 'Tiếp tục với Google',
    passwordLabel: 'Mật khẩu',
    passwordPlaceholder: 'Tối thiểu 6 ký tự',
    submittingButton: 'Đang xử lý...',
    modes: {
        login: {
            alternateModeLabel: 'Chưa có tài khoản?',
            intro: 'Đăng nhập để tiếp tục quản lý chi tiêu.',
            submitButton: 'Đăng nhập',
            switchButton: 'Đăng ký',
            title: 'Đăng nhập',
        },
        register: {
            alternateModeLabel: 'Đã có tài khoản?',
            intro: 'Đăng ký để lưu dữ liệu chi tiêu theo tài khoản của bạn.',
            submitButton: 'Đăng ký',
            switchButton: 'Đăng nhập',
            title: 'Tạo tài khoản',
        },
    },
}

export const authErrorMessages = {
    'auth/email-already-in-use': 'Email này đã được đăng ký.',
    'auth/invalid-credential': 'Email hoặc mật khẩu không đúng.',
    'auth/invalid-email': 'Địa chỉ email không hợp lệ.',
    'auth/network-request-failed': 'Không thể kết nối Firebase. Vui lòng kiểm tra mạng.',
    'auth/operation-not-allowed': 'Phương thức đăng nhập này chưa được bật trong Firebase Console.',
    'auth/popup-blocked': 'Trình duyệt đã chặn cửa sổ đăng nhập Google.',
    'auth/popup-closed-by-user': 'Cửa sổ đăng nhập Google đã bị đóng.',
    'auth/too-many-requests': 'Bạn thử quá nhiều lần. Vui lòng thử lại sau.',
    'auth/unauthorized-domain': 'Domain hiện tại chưa được thêm vào Authorized domains.',
    'auth/weak-password': 'Mật khẩu cần có ít nhất 6 ký tự.',
}

export function getAuthErrorMessage(error) {
    return authErrorMessages[error.code]
        || 'Không thể xác thực. Vui lòng thử lại.'
}
