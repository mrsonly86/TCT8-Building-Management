// Authentication module
class AuthManager {
    constructor() {
        this.users = [
            { username: 'admin', password: 'admin123', role: 'admin', name: 'Quản trị viên' },
            { username: 'manager', password: 'manager123', role: 'manager', name: 'Quản lý' }
        ];
        this.init();
    }

    init() {
        // Check if we're on login page
        if (window.location.pathname.includes('login.html') || window.location.pathname === '/') {
            this.initLoginPage();
        } else {
            this.checkAuthentication();
        }
    }

    initLoginPage() {
        const loginForm = document.getElementById('loginForm');
        const togglePassword = document.getElementById('togglePassword');
        const passwordInput = document.getElementById('password');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (togglePassword) {
            togglePassword.addEventListener('click', () => {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                togglePassword.querySelector('i').classList.toggle('fa-eye');
                togglePassword.querySelector('i').classList.toggle('fa-eye-slash');
            });
        }

        // Auto-fill demo credentials on demo button click
        this.addDemoLoginHandlers();
    }

    addDemoLoginHandlers() {
        // Add click handlers for demo credentials text
        const demoText = document.querySelector('.text-muted.small');
        if (demoText) {
            demoText.addEventListener('click', (e) => {
                if (e.target.textContent.includes('admin')) {
                    document.getElementById('username').value = 'admin';
                    document.getElementById('password').value = 'admin123';
                } else if (e.target.textContent.includes('manager')) {
                    document.getElementById('username').value = 'manager';
                    document.getElementById('password').value = 'manager123';
                }
            });
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        // Validate input
        if (!username || !password) {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: 'Vui lòng nhập đầy đủ thông tin đăng nhập!'
                });
            } else {
                alert('Vui lòng nhập đầy đủ thông tin đăng nhập!');
            }
            return;
        }

        // Find user
        const user = this.users.find(u => u.username === username && u.password === password);

        if (user) {
            // Login successful
            const sessionData = {
                username: user.username,
                role: user.role,
                name: user.name,
                loginTime: new Date().toISOString(),
                rememberMe: rememberMe
            };

            // Store session
            if (rememberMe) {
                localStorage.setItem('tct8_session', JSON.stringify(sessionData));
            } else {
                sessionStorage.setItem('tct8_session', JSON.stringify(sessionData));
            }

            // Show success message
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'success',
                    title: 'Đăng nhập thành công!',
                    text: `Chào mừng ${user.name}`,
                    timer: 1500,
                    showConfirmButton: false
                }).then(() => {
                    // Redirect to dashboard
                    window.location.href = 'index.html';
                });
            } else {
                alert(`Đăng nhập thành công! Chào mừng ${user.name}`);
                window.location.href = 'index.html';
            }

        } else {
            // Login failed
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'Đăng nhập thất bại',
                    text: 'Tên đăng nhập hoặc mật khẩu không đúng!'
                });
            } else {
                alert('Đăng nhập thất bại! Tên đăng nhập hoặc mật khẩu không đúng!');
            }
        }
    }

    checkAuthentication() {
        const session = this.getSession();
        
        if (!session) {
            // Not logged in, redirect to login
            window.location.href = 'login.html';
            return false;
        }

        // Check session expiry (24 hours for remember me, 2 hours for normal session)
        const loginTime = new Date(session.loginTime);
        const now = new Date();
        const maxAge = session.rememberMe ? 24 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000; // 24h or 2h

        if (now - loginTime > maxAge) {
            this.logout();
            return false;
        }

        return true;
    }

    getSession() {
        let session = localStorage.getItem('tct8_session');
        if (!session) {
            session = sessionStorage.getItem('tct8_session');
        }
        return session ? JSON.parse(session) : null;
    }

    getCurrentUser() {
        const session = this.getSession();
        return session || null;
    }

    logout() {
        localStorage.removeItem('tct8_session');
        sessionStorage.removeItem('tct8_session');
        
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'info',
                title: 'Đã đăng xuất',
                text: 'Bạn đã được đăng xuất khỏi hệ thống',
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                window.location.href = 'login.html';
            });
        } else {
            alert('Đã đăng xuất khỏi hệ thống');
            window.location.href = 'login.html';
        }
    }

    hasPermission(requiredRole) {
        const user = this.getCurrentUser();
        if (!user) return false;

        const roleHierarchy = {
            'admin': 3,
            'manager': 2,
            'user': 1
        };

        const userLevel = roleHierarchy[user.role] || 0;
        const requiredLevel = roleHierarchy[requiredRole] || 999;

        return userLevel >= requiredLevel;
    }
}

// Utility functions for form validation
function validateInput(input, rules = {}) {
    const value = input.value.trim();
    const errors = [];

    if (rules.required && !value) {
        errors.push('Trường này là bắt buộc');
    }

    if (rules.minLength && value.length < rules.minLength) {
        errors.push(`Tối thiểu ${rules.minLength} ký tự`);
    }

    if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`Tối đa ${rules.maxLength} ký tự`);
    }

    if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(rules.patternMessage || 'Định dạng không hợp lệ');
    }

    if (rules.email && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors.push('Email không hợp lệ');
    }

    if (rules.phone && value && !/^[0-9+\-\s()]+$/.test(value)) {
        errors.push('Số điện thoại không hợp lệ');
    }

    return errors;
}

function showFieldError(input, errors) {
    const errorDiv = input.parentNode.querySelector('.field-error');
    
    if (errors.length > 0) {
        input.classList.add('is-invalid');
        if (errorDiv) {
            errorDiv.textContent = errors[0];
        } else {
            const div = document.createElement('div');
            div.className = 'field-error text-danger small mt-1';
            div.textContent = errors[0];
            input.parentNode.appendChild(div);
        }
    } else {
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
        if (errorDiv) {
            errorDiv.remove();
        }
    }
}

// Initialize authentication
const authManager = new AuthManager();