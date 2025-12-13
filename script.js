const CONFIG = {
    SPREADSHEET_ID: '1VBRu1e8EvQinHU99nhY-9o5tb6r7QeVdRGpWbx8Jkoo',
    SHEETS: [
        "LAPORAN DIOS SAPRI",
        "TM",
        "SO ADI",
        "SO HERY",
        "SO DHARMA",
        "SO HALIFAH",
        "SO NURDIN",
        "SO NUR",
        "SO PEGGY",
        "SO RUSLAN",
        "SO SAPRI"
    ]
};

const state = {
    currentSheet: CONFIG.SHEETS[0],
    isLoading: false,
    isAuthenticated: false
};

// DOM Elements
const navLinksContainer = document.getElementById('nav-links');
const pageTitle = document.getElementById('page-title');
const tableHeader = document.getElementById('table-header');
const tableBody = document.getElementById('table-body');
const loadingOverlay = document.getElementById('loading-overlay');
const refreshBtn = document.getElementById('refresh-btn');
const loginOverlay = document.getElementById('login-overlay');
const loginBtn = document.getElementById('login-btn');
const passwordInput = document.getElementById('password-input');
const loginError = document.getElementById('login-error');

// Initialize App
function init() {
    // Check if session storage has auth (optional, sticking to manual for now as per req)
    // Setup Login Listeners
    loginBtn.addEventListener('click', attemptLogin);
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') attemptLogin();
    });

    refreshBtn.addEventListener('click', () => {
        if (state.isAuthenticated) loadData(state.currentSheet);
    });
}

// Login Logic
function attemptLogin() {
    const code = passwordInput.value;
    if (code === '333') {
        state.isAuthenticated = true;
        loginOverlay.style.opacity = '0';
        setTimeout(() => {
            loginOverlay.style.display = 'none';
        }, 500); // Wait for transition

        // Start App
        renderSidebar();
        loadData(state.currentSheet);
    } else {
        loginError.innerText = 'Kode salah! Silakan coba lagi.';
        passwordInput.value = '';
        passwordInput.focus();
        // Shake animation effect
        const card = document.querySelector('.login-card');
        card.style.transform = 'translateX(10px)';
        setTimeout(() => card.style.transform = 'translateX(-10px)', 100);
        setTimeout(() => card.style.transform = 'translateX(0)', 200);
    }
}

// Render Sidebar Navigation
function renderSidebar() {
    navLinksContainer.innerHTML = '';
    CONFIG.SHEETS.forEach(sheetName => {
        const item = document.createElement('div');
        item.className = `nav-item ${sheetName === state.currentSheet ? 'active' : ''}`;
        item.innerHTML = `<span>📊</span>${sheetName}`;
        item.onclick = () => switchSheet(sheetName);
        navLinksContainer.appendChild(item);
    });
}

// Switch Sheet
function switchSheet(sheetName) {
    if (state.isLoading || state.currentSheet === sheetName) return;

    state.currentSheet = sheetName;

    // Update Sidebar UI
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        if (item.innerText.includes(sheetName)) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    loadData(sheetName);
}

// Fetch and Load Data
async function loadData(sheetName) {
    setLoading(true);
    pageTitle.innerText = sheetName;

    try {
        // Construct GViz URL
        const url = `https://docs.google.com/spreadsheets/d/${CONFIG.SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;

        const response = await fetch(url);
        const text = await response.text();

        // Remove the prefix /*O_o*/ to get valid JSON
        const jsonText = text.replace('/*O_o*/', '').replace(/(google\.visualization\.Query\.setResponse\()|(\);)/g, '');
        const data = JSON.parse(jsonText);

        renderTable(data);

    } catch (error) {
        console.error('Error fetching data:', error);
        renderError('Gagal memuat data. Pastikan sheet akses publik atau nama sheet benar.');
    } finally {
        setLoading(false);
    }
}

// Render Table
function renderTable(data) {
    const cols = data.table.cols;
    const rows = data.table.rows;

    // Clear previous
    tableHeader.innerHTML = '';
    tableBody.innerHTML = '';

    if (rows.length === 0) {
        renderError("Data kosong.");
        return;
    }

    // Header
    const headerRow = document.createElement('tr');
    cols.forEach(col => {
        const th = document.createElement('th');
        th.innerText = col.label || ''; // Sometimes label is empty
        headerRow.appendChild(th);
    });
    tableHeader.appendChild(headerRow);

    // Body
    rows.forEach(row => {
        const tr = document.createElement('tr');
        row.c.forEach(cell => {
            const td = document.createElement('td');
            // Check if cell is null options
            const val = cell ? (cell.f ? cell.f : cell.v) : '';
            td.innerText = val !== null ? val : '';
            tr.appendChild(td);
        });
        tableBody.appendChild(tr);
    });
}

// Helper: Show/Hide Loading
function setLoading(loading) {
    state.isLoading = loading;
    loadingOverlay.style.display = loading ? 'flex' : 'none';
}

function renderError(msg) {
    tableHeader.innerHTML = '';
    tableBody.innerHTML = `<tr><td colspan="100" class="error-msg">${msg}</td></tr>`;
}

// Start
document.addEventListener('DOMContentLoaded', init);
