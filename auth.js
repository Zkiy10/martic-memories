const authForm = document.querySelector('#auth-form');
const authFeedback = document.querySelector('#auth-feedback');
const authModeButtons = document.querySelectorAll('[data-auth-mode]');
const authSubmit = document.querySelector('#auth-submit');
const usernameInput = document.querySelector('#auth-username');
const passwordInput = document.querySelector('#auth-password');
const confirmPasswordField = document.querySelector('#confirm-password-field');
const confirmPasswordInput = document.querySelector('#auth-confirm-password');
let authMode = 'login';
const passwordIterations = 120000;

const setFeedback = (message, isError = false) => {
    authFeedback.textContent = message;
    authFeedback.classList.toggle('is-error', isError);
};

const readAccounts = () => {
    const storedAccounts = localStorage.getItem('marticUsers');
    if (!storedAccounts) {
        return {};
    }

    try {
        const accounts = JSON.parse(storedAccounts);
        if (!accounts || Array.isArray(accounts) || typeof accounts !== 'object') {
            throw new Error('Format data akun tidak valid.');
        }
        return accounts;
    } catch (error) {
        if (error instanceof SyntaxError) {
            throw new Error('Data akun rusak. Hapus data MARTIC di browser lalu coba lagi.');
        }
        throw error;
    }
};

const hashPassword = async (password, salt) => {
    if (!globalThis.crypto?.subtle) {
        throw new Error('Fitur keamanan browser tidak tersedia. Buka situs lewat localhost atau HTTPS.');
    }

    const passwordBytes = new TextEncoder().encode(password);
    const key = await crypto.subtle.importKey('raw', passwordBytes, 'PBKDF2', false, ['deriveBits']);
    const digest = await crypto.subtle.deriveBits({
        name: 'PBKDF2',
        salt,
        iterations: passwordIterations,
        hash: 'SHA-256'
    }, key, 256);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
};

const createSalt = () => {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    return {
        bytes: salt,
        hex: Array.from(salt, (byte) => byte.toString(16).padStart(2, '0')).join('')
    };
};

const saltFromHex = (hex) => new Uint8Array(hex.match(/.{2}/g).map((byte) => parseInt(byte, 16)));

authModeButtons.forEach((button) => {
    button.addEventListener('click', () => {
        authMode = button.dataset.authMode;
        const isRegisterMode = authMode === 'register';

        authModeButtons.forEach((modeButton) => {
            const isSelected = modeButton === button;
            modeButton.classList.toggle('is-active', isSelected);
            modeButton.setAttribute('aria-selected', String(isSelected));
        });

        confirmPasswordField.hidden = !isRegisterMode;
        confirmPasswordInput.required = isRegisterMode;
        passwordInput.autocomplete = isRegisterMode ? 'new-password' : 'current-password';
        authSubmit.textContent = isRegisterMode ? 'Buat akun' : 'Masuk';
        setFeedback('');
    });
});

authForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    setFeedback('');

    const username = usernameInput.value.trim();
    const normalizedUsername = username.toLowerCase();
    const password = passwordInput.value;

    if (!username || !password) {
        setFeedback('Username dan password wajib diisi.', true);
        return;
    }

    if (authMode === 'register' && password !== confirmPasswordInput.value) {
        setFeedback('Konfirmasi password belum sama.', true);
        return;
    }

    try {
        const accounts = readAccounts();

        if (authMode === 'register') {
            if (accounts[normalizedUsername]) {
                setFeedback('Username sudah dipakai. Coba username lain.', true);
                return;
            }

            const salt = createSalt();
            accounts[normalizedUsername] = {
                username,
                passwordSalt: salt.hex,
                passwordHash: await hashPassword(password, salt.bytes)
            };
            localStorage.setItem('marticUsers', JSON.stringify(accounts));
            setFeedback('Akun berhasil dibuat. Sekarang kamu bisa masuk.');
            authForm.reset();
            return;
        }

        const account = accounts[normalizedUsername];
        if (!account) {
            setFeedback('Akun tidak ditemukan. Silakan registrasi terlebih dahulu!', true);
            return;
        }

        if (!account.passwordSalt || !account.passwordHash) {
            setFeedback('Data akun tidak lengkap. Silakan buat akun kembali.', true);
            return;
        }

        if (account.passwordHash !== await hashPassword(password, saltFromHex(account.passwordSalt))) {
            setFeedback('Password salah!', true);
            return;
        }

        sessionStorage.setItem('marticSession', account.username);
        setFeedback(`Berhasil masuk. Halo, ${account.username}!`);
        authForm.reset();
    } catch (error) {
        setFeedback(error instanceof Error ? error.message : 'Terjadi kesalahan saat memproses akun.', true);
    }
});
