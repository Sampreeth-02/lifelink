// State
let currentUser = null;
let currentRole = null;
let map = null;
let markers = [];
let userLocation = null;

// DOM Elements
const authView = document.getElementById('auth-view');
const profileView = document.getElementById('profile-view');
const dashboardView = document.getElementById('dashboard-view');
const authModal = document.getElementById('auth-modal');
const authTitle = document.getElementById('auth-title');
const authRole = document.getElementById('auth-role');
const authAction = document.getElementById('auth-action');
const authSubmitBtn = document.getElementById('auth-submit-btn');

// --- Navigation & Auth UI ---

function showLogin(role) {
    authTitle.innerText = `Login as ${role.replace('_', ' ')}`;
    authRole.value = role;
    authAction.value = 'login';
    authSubmitBtn.innerText = 'Login';
    document.getElementById('auth-error').innerText = '';
    authModal.classList.remove('hidden');
}

function showRegister(role) {
    authTitle.innerText = `Register as ${role.replace('_', ' ')}`;
    authRole.value = role;
    authAction.value = 'register';
    authSubmitBtn.innerText = 'Register';
    document.getElementById('auth-error').innerText = '';
    authModal.classList.remove('hidden');
}

function closeAuthModal() {
    authModal.classList.add('hidden');
}

async function handleAuth(e) {
    e.preventDefault();
    const action = authAction.value;
    const role = authRole.value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('auth-error');

    try {
        const res = await fetch(`/api/auth/${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, role })
        });

        if (res.ok) {
            currentUser = await res.json();
            currentRole = role;
            closeAuthModal();
            
            if (action === 'register' && role === 'DONOR') {
                showView('profile');
            } else {
                initDashboard();
            }
        } else {
            const errText = await res.text();
            errorDiv.innerText = errText || 'Authentication failed.';
        }
    } catch (err) {
        errorDiv.innerText = 'Server error. Please try again.';
    }
}

// --- Profile Setup ---

function getLocation() {
    const locStatus = document.getElementById('loc-status');
    locStatus.innerText = 'Fetching location...';
    locStatus.className = 'location-status';
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                document.getElementById('lat').value = position.coords.latitude;
                document.getElementById('lng').value = position.coords.longitude;
                locStatus.innerText = 'Location captured successfully!';
                locStatus.className = 'location-status success';
                document.getElementById('profile-submit').disabled = false;
            },
            (error) => {
                locStatus.innerText = 'Location access denied or failed.';
            }
        );
    } else {
        locStatus.innerText = 'Geolocation is not supported by this browser.';
    }
}

async function handleProfileSetup(e) {
    e.preventDefault();
    if (!currentUser) return;

    const bloodGroup = document.getElementById('blood-group').value;
    const status = document.getElementById('status').value;
    const lat = document.getElementById('lat').value;
    const lng = document.getElementById('lng').value;

    try {
        const res = await fetch(`/api/auth/${currentUser.id}/profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bloodGroup, status, latitude: lat, longitude: lng })
        });

        if (res.ok) {
            initDashboard();
        } else {
            alert('Failed to save profile.');
        }
    } catch (err) {
        alert('Server error.');
    }
}

// --- Dashboard & Map ---

function initDashboard() {
    showView('dashboard');
    document.getElementById('user-role-badge').innerText = currentRole.replace('_', ' ');

    if (!map) {
        // Initialize Leaflet Map
        // Default center to Bengaluru
        map = L.map('map').setView([12.9716, 77.5946], 12);
        
        // CartoDB Dark Matter tile layer for dark theme aesthetic
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(map);

        // Center map to user location if available
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                map.setView([lat, lng], 13);
                
                // Add a blue marker for current user
                const userIcon = L.divIcon({
                    html: '<div style="background:#4a90e2; width:15px; height:15px; border-radius:50%; border:2px solid white; box-shadow: 0 0 10px rgba(74,144,226,0.8);"></div>',
                    className: '',
                    iconSize: [15, 15]
                });
                L.marker([lat, lng], {icon: userIcon}).addTo(map).bindPopup('You are here');
            });
        }
    }

    loadDonors();
}

async function loadDonors() {
    try {
        const res = await fetch('/api/donors');
        const donors = await res.json();
        
        // Clear existing markers
        markers.forEach(m => map.removeLayer(m));
        markers = [];

        document.getElementById('total-donors').innerText = donors.length;

        // Custom red heart marker icon
        const heartIcon = L.divIcon({
            html: '<div style="font-size: 24px; color: #ff4b4b; filter: drop-shadow(0 0 5px rgba(255,75,75,0.6));">❤️</div>',
            className: '',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });

        donors.forEach(donor => {
            if (donor.latitude && donor.longitude) {
                const marker = L.marker([donor.latitude, donor.longitude], {icon: heartIcon})
                    .addTo(map);
                
                const popupContent = `
                    <div style="text-align: center;">
                        <h3>Blood Group: <span style="font-size: 1.2rem; font-weight: bold;">${donor.bloodGroup}</span></h3>
                        <p>Status: ${donor.status}</p>
                        <button onclick="alert('Calling donor...\\nThis is a demo feature.')">Call Donor</button>
                    </div>
                `;
                marker.bindPopup(popupContent);
                markers.push(marker);
            }
        });
    } catch (err) {
        console.error("Failed to load donors", err);
    }
}

function logout() {
    currentUser = null;
    currentRole = null;
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    showView('auth');
}

function showView(viewName) {
    authView.classList.add('hidden');
    profileView.classList.add('hidden');
    dashboardView.classList.add('hidden');
    
    authView.classList.remove('active');
    profileView.classList.remove('active');
    dashboardView.classList.remove('active');

    if (viewName === 'auth') {
        authView.classList.remove('hidden');
        authView.classList.add('active');
    } else if (viewName === 'profile') {
        profileView.classList.remove('hidden');
        profileView.classList.add('active');
    } else if (viewName === 'dashboard') {
        dashboardView.classList.remove('hidden');
        dashboardView.classList.add('active');
        if (map) {
            setTimeout(() => map.invalidateSize(), 100);
        }
    }
}
