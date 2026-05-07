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
    document.getElementById('user-role-badge').innerText = currentRole === 'DONOR' ? 'User' : 'Blood Bank';

    if (currentRole === 'BLOOD_BANK') {
        document.getElementById('bank-actions').classList.remove('hidden');
        document.getElementById('active-requests-section').classList.add('hidden');
        document.getElementById('donor-stats').classList.add('hidden');
        document.getElementById('nearby-label').innerText = 'Dashboard';
        document.getElementById('sidebar-desc').innerText = 'Manage your urgent blood requests here.';
    } else {
        document.getElementById('bank-actions').classList.add('hidden');
        document.getElementById('active-requests-section').classList.remove('hidden');
        document.getElementById('donor-stats').classList.remove('hidden');
        document.getElementById('nearby-label').innerText = 'Donors & Requests';
        document.getElementById('stat-label-text').innerText = 'Available Donors';
        document.getElementById('sidebar-desc').innerText = 'Available blood groups nearby and urgent requests.';
    }

    if (!map) {
        map = L.map('map').setView([12.9716, 77.5946], 12);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap &copy; CARTO',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(map);

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                map.setView([userLocation.lat, userLocation.lng], 13);
                
                const userIcon = L.divIcon({
                    html: '<div style="background:#4a90e2; width:15px; height:15px; border-radius:50%; border:2px solid white; box-shadow: 0 0 10px rgba(74,144,226,0.8);"></div>',
                    className: '',
                    iconSize: [15, 15]
                });
                L.marker([userLocation.lat, userLocation.lng], {icon: userIcon}).addTo(map).bindPopup('You are here');
            });
        }
    }

    loadMapData();
}

async function loadMapData() {
    // Clear existing markers
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    if (currentRole === 'DONOR') {
        await loadDonors();
        await loadRequests();
    }
}

async function loadDonors() {
    try {
        const res = await fetch('/api/donors');
        const donors = await res.json();
        
        document.getElementById('total-donors').innerText = donors.length;

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

let currentFilter = 'ALL';

function filterMap() {
    currentFilter = document.getElementById('search-blood-group').value;
    loadMapData();
}

async function loadRequests() {
    try {
        const [reqRes, availRes] = await Promise.all([
            fetch('/api/requests?type=REQUEST'),
            fetch('/api/requests?type=AVAILABLE')
        ]);
        
        // Apply search filter if selected
        let requests = await reqRes.json();
        let available = await availRes.json();
        
        if (currentFilter !== 'ALL') {
            requests = requests.filter(r => r.bloodGroup === currentFilter);
            available = available.filter(r => r.bloodGroup === currentFilter);
        }
        
        const reqDiv = document.getElementById('requests-list');
        const availDiv = document.getElementById('available-list');
        reqDiv.innerHTML = '';
        availDiv.innerHTML = '';

        const hospitalRedIcon = L.divIcon({
            html: '<div style="font-size: 24px; color: white; background: #ff4b4b; border-radius: 5px; padding: 2px; text-align:center; border:1px solid white;">🏥</div>',
            className: '', iconSize: [30, 30], iconAnchor: [15, 15]
        });
        
        const hospitalBlueIcon = L.divIcon({
            html: '<div style="font-size: 24px; color: white; background: #4a90e2; border-radius: 5px; padding: 2px; text-align:center; border:1px solid white;">🏥</div>',
            className: '', iconSize: [30, 30], iconAnchor: [15, 15]
        });

        requests.forEach(req => {
            reqDiv.innerHTML += `
                <div style="background: rgba(255,75,75,0.2); border: 1px solid var(--primary-red); padding: 10px; border-radius: 5px;">
                    <strong style="color:var(--primary-red);">${req.bloodGroup} Needed</strong><br>
                    <small>by ${req.bankName}</small>
                </div>
            `;
            if (req.latitude && req.longitude) {
                const marker = L.marker([req.latitude, req.longitude], {icon: hospitalRedIcon}).addTo(map);
                marker.bindPopup(`<div style="text-align: center;"><h3>Urgent: <span style="font-size: 1.2rem; font-weight: bold; color:var(--primary-red);">${req.bloodGroup}</span></h3><p>Requested by: ${req.bankName}</p><button onclick="alert('Navigating to Blood Bank...')">Donate</button></div>`);
                markers.push(marker);
            }
        });

        available.forEach(avail => {
            availDiv.innerHTML += `
                <div style="background: rgba(74,144,226,0.2); border: 1px solid #4a90e2; padding: 10px; border-radius: 5px;">
                    <strong style="color:#4a90e2;">${avail.bloodGroup} Available</strong><br>
                    <small>at ${avail.bankName}</small>
                </div>
            `;
            if (avail.latitude && avail.longitude) {
                const marker = L.marker([avail.latitude, avail.longitude], {icon: hospitalBlueIcon}).addTo(map);
                marker.bindPopup(`<div style="text-align: center;"><h3>Available: <span style="font-size: 1.2rem; font-weight: bold; color:#4a90e2;">${avail.bloodGroup}</span></h3><p>Bank: ${avail.bankName}</p><button onclick="alert('Navigating to Blood Bank...')">Get Blood</button></div>`);
                markers.push(marker);
            }
        });
    } catch (err) {
        console.error("Failed to load requests", err);
    }
}

async function submitBloodAction(type) {
    if (!userLocation) {
        alert("Waiting for location. Please allow location access first.");
        return;
    }
    
    const isReq = type === 'REQUEST';
    const bg = document.getElementById(isReq ? 'request-blood-group' : 'available-blood-group').value;
    const btn = document.getElementById(isReq ? 'raise-req-btn' : 'add-avail-btn');
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = 'Processing...';

    try {
        const res = await fetch('/api/requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                bloodGroup: bg,
                bankName: currentUser.username,
                latitude: userLocation.lat,
                longitude: userLocation.lng,
                type: type
            })
        });

        if (res.ok) {
            alert(`Successfully declared ${bg} as ${isReq ? 'urgently needed' : 'available'}!`);
        } else {
            alert('Failed to process request');
        }
    } catch (err) {
        alert('Server error.');
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
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
