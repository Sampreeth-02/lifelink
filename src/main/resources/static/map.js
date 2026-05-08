// State
let currentUser = null;
let currentRole = null;
let map = null;
let markers = [];
let userLocation = null;
let stagedRequests = [];

// DOM Elements
const authView = document.getElementById('auth-view');
const profileView = document.getElementById('profile-view');
const dashboardView = document.getElementById('dashboard-view');
const authModal = document.getElementById('auth-modal');
const authTitle = document.getElementById('auth-title');
const authRole = document.getElementById('auth-role');
const authAction = document.getElementById('auth-action');
const authSubmitBtn = document.getElementById('auth-submit-btn');

const landingView = document.getElementById('landing-view');

function showAuthPage(role) {
    authTitle.innerText = `${role === 'DONOR' ? 'User' : 'Blood Bank'} Portal`;
    authRole.value = role;
    setAuthAction('login');
    showView('auth');
}

function setAuthAction(action) {
    authAction.value = action;
    if (action === 'login') {
        document.getElementById('tab-login').classList.remove('secondary-btn');
        document.getElementById('tab-login').classList.add('primary-btn');
        document.getElementById('tab-register').classList.remove('primary-btn');
        document.getElementById('tab-register').classList.add('secondary-btn');
        authSubmitBtn.innerText = 'Login';
    } else {
        document.getElementById('tab-register').classList.remove('secondary-btn');
        document.getElementById('tab-register').classList.add('primary-btn');
        document.getElementById('tab-login').classList.remove('primary-btn');
        document.getElementById('tab-login').classList.add('secondary-btn');
        authSubmitBtn.innerText = 'Register';
    }
    document.getElementById('auth-error').innerText = '';
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
        document.getElementById('nearby-label').innerText = 'Bank Dashboard';
        document.getElementById('sidebar-desc').innerText = 'Manage your urgent blood requests here.';
        
        document.getElementById('user-map-container').classList.add('hidden');
        document.getElementById('map-placeholder').classList.add('hidden');
        document.getElementById('bank-panel').classList.remove('hidden');
        
        loadBankInventory();
    } else {
        document.getElementById('bank-actions').classList.add('hidden');
        document.getElementById('active-requests-section').classList.remove('hidden');
        document.getElementById('bank-details-panel').classList.add('hidden');
        document.getElementById('nearby-label').innerText = 'Search Blood';
        document.getElementById('sidebar-desc').innerText = 'Search for available blood and urgent requests.';
        
        document.getElementById('user-map-container').classList.add('hidden');
        document.getElementById('map-placeholder').classList.remove('hidden');
        document.getElementById('bank-panel').classList.add('hidden');
        
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
    }

    loadMapData();
}

async function loadMapData() {
    try {
        if (map) {
            markers.forEach(m => map.removeLayer(m));
            markers = [];
        }

        const [reqRes, availRes] = await Promise.all([
            fetch('/api/requests?type=REQUEST'),
            fetch('/api/requests?type=AVAILABLE')
        ]);
        
        let requests = await reqRes.json();
        let available = await availRes.json();
        
        if (currentFilter !== 'ALL') {
            requests = requests.filter(r => r.bloodGroup === currentFilter);
            available = available.filter(r => r.bloodGroup === currentFilter);
        }
        
        // Populate Sidebar Lists (if they exist)
        const reqDiv = document.getElementById('requests-list');
        const availDiv = document.getElementById('available-list');
        if (reqDiv) reqDiv.innerHTML = '';
        if (availDiv) availDiv.innerHTML = '';

        let hospitalRedIcon = null;
        let hospitalBlueIcon = null;
        if (map) {
            hospitalRedIcon = L.divIcon({
                html: '<div style="font-size: 24px; color: white; background: #ff4b4b; border-radius: 5px; padding: 2px; text-align:center; border:1px solid white;">🏥</div>',
                className: '', iconSize: [30, 30], iconAnchor: [15, 15]
            });
            hospitalBlueIcon = L.divIcon({
                html: '<div style="font-size: 24px; color: white; background: #4a90e2; border-radius: 5px; padding: 2px; text-align:center; border:1px solid white;">🏥</div>',
                className: '', iconSize: [30, 30], iconAnchor: [15, 15]
            });
        }

        requests.forEach(req => {
            if (reqDiv) {
                const escapedBankName = req.bankName.replace(/'/g, "\\'");
                const escapedBg = req.bloodGroup.replace(/'/g, "\\'");
                reqDiv.innerHTML += `
                    <div onclick="showBankDetails('${escapedBankName}', '${escapedBg}', ${req.units || 1}, ${req.latitude || 0}, ${req.longitude || 0})" style="background: rgba(255,75,75,0.2); border: 1px solid var(--primary-red); padding: 10px; border-radius: 5px; cursor: pointer; transition: 0.2s;" onmouseover="this.style.background='rgba(255,75,75,0.4)'" onmouseout="this.style.background='rgba(255,75,75,0.2)'">
                        <strong style="color:var(--primary-red);">${req.bloodGroup} Needed (${req.units || 1} units)</strong><br>
                        <small>by ${req.bankName}</small>
                    </div>
                `;
            }
            if (map && req.latitude && req.longitude) {
                const marker = L.marker([req.latitude, req.longitude], {icon: hospitalRedIcon}).addTo(map);
                marker.bindPopup(`
                    <div style="text-align: center;">
                        <h3 style="margin-bottom: 5px; color: var(--primary-red);">${req.bankName}</h3>
                        <p style="margin-bottom: 5px; font-weight: bold; color: var(--primary-red);">NEEDS: ${req.bloodGroup} (${req.units || 1} units)</p>
                        <button onclick="navigateTo(${req.latitude}, ${req.longitude})" class="btn primary-btn full-width" style="padding: 5px 10px; font-size: 0.8rem;">Navigate</button>
                    </div>
                `);
                markers.push(marker);
            }
        });

        available.forEach(avail => {
            if (availDiv) {
                availDiv.innerHTML += `
                    <div onclick="focusMapOn(${avail.latitude || 0}, ${avail.longitude || 0})" style="background: rgba(74,144,226,0.2); border: 1px solid #4a90e2; padding: 10px; border-radius: 5px; cursor: pointer; transition: 0.2s; position: relative;" onmouseover="this.style.background='rgba(74,144,226,0.4)'" onmouseout="this.style.background='rgba(74,144,226,0.2)'">
                        <strong style="color:#4a90e2;">${avail.bloodGroup} Available (${avail.units || 1} units)</strong><br>
                        <small>at ${avail.bankName}</small>
                        <button onclick="event.stopPropagation(); navigateTo(${avail.latitude || 0}, ${avail.longitude || 0})" class="btn secondary-btn" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); padding: 5px 10px; font-size: 0.8rem; margin: 0;">Navigate</button>
                    </div>
                `;
            }
            if (map && avail.latitude && avail.longitude) {
                const marker = L.marker([avail.latitude, avail.longitude], {icon: hospitalBlueIcon}).addTo(map);
                marker.bindPopup(`
                    <div style="text-align: center;">
                        <h3 style="margin-bottom: 5px; color: #4a90e2;">${avail.bankName}</h3>
                        <p style="margin-bottom: 5px; font-weight: bold; color: #4a90e2;">HAS: ${avail.bloodGroup} (${avail.units || 1} units)</p>
                        <button onclick="navigateTo(${avail.latitude}, ${avail.longitude})" class="btn primary-btn full-width" style="padding: 5px 10px; font-size: 0.8rem; background: #4a90e2; border-color: #4a90e2;">Navigate</button>
                    </div>
                `);
                markers.push(marker);
            }
        });

        // Populate Table for Bank View
        const tableBody = document.getElementById('inventory-table-body');
        if (tableBody) {
            tableBody.innerHTML = '';
            if (available.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px; color: var(--text-muted);">No available inventory found.</td></tr>`;
            } else {
                available.forEach(avail => {
                    tableBody.innerHTML += `
                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                            <td style="padding: 10px;"><strong style="color: #4a90e2;">${avail.bloodGroup}</strong></td>
                            <td style="padding: 10px;">${avail.units || 1}</td>
                            <td style="padding: 10px;">${avail.bankName}</td>
                            <td style="padding: 10px;">
                                <button class="btn secondary-btn" style="padding: 5px 10px; font-size: 0.8rem; margin: 0;" onclick="alert('Contacting ${avail.bankName}...')">Contact</button>
                            </td>
                        </tr>
                    `;
                });
            }
        }
        
    } catch (err) {
        console.error("Failed to load requests", err);
    }
}

let currentFilter = 'ALL';

function filterMap() {
    currentFilter = document.getElementById('search-blood-group').value;
    
    // Show map and hide placeholder
    document.getElementById('map-placeholder').classList.add('hidden');
    document.getElementById('user-map-container').classList.remove('hidden');
    
    if (map) {
        setTimeout(() => map.invalidateSize(), 100);
    }
    
    loadMapData();
}

function showBankDetails(bankName, bloodGroup, units, lat, lng) {
    document.getElementById('detail-bank-name').innerText = bankName;
    document.getElementById('detail-blood-group').innerText = `Needs: ${bloodGroup} (${units} units)`;
    document.getElementById('detail-navigate-btn').onclick = function() {
        navigateTo(lat, lng);
    };
    
    document.getElementById('bank-details-panel').classList.remove('hidden');
    focusMapOn(lat, lng);
}

function focusMapOn(lat, lng) {
    if (currentRole !== 'DONOR') return; // Only users have the map
    
    // Hide placeholder and show map container if not already visible
    document.getElementById('map-placeholder').classList.add('hidden');
    document.getElementById('user-map-container').classList.remove('hidden');
    
    if (map) {
        setTimeout(() => {
            map.invalidateSize();
            if (lat !== 0 && lng !== 0) {
                map.setView([lat, lng], 15);
            } else {
                alert("Location not provided for this bank.");
            }
        }, 100);
    }
}

function navigateTo(destLat, destLng) {
    if (!destLat || !destLng || (destLat === 0 && destLng === 0)) {
        alert("Location not provided for this bank.");
        return;
    }

    if (navigator.geolocation) {
        // We can check if we already have userLocation to speed this up
        if (userLocation && userLocation.lat) {
            const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${destLat},${destLng}`;
            window.open(url, '_blank');
        } else {
            navigator.geolocation.getCurrentPosition((pos) => {
                const url = `https://www.google.com/maps/dir/?api=1&origin=${pos.coords.latitude},${pos.coords.longitude}&destination=${destLat},${destLng}`;
                window.open(url, '_blank');
            }, () => {
                alert("Could not get your current location. Opening map to destination instead.");
                window.open(`https://www.google.com/maps/search/?api=1&query=${destLat},${destLng}`, '_blank');
            });
        }
    } else {
        alert("Geolocation is not supported by your browser. Opening map to destination instead.");
        window.open(`https://www.google.com/maps/search/?api=1&query=${destLat},${destLng}`, '_blank');
    }
}

function addRequestToList() {
    const bg = document.getElementById('list-req-bg').value;
    const units = parseInt(document.getElementById('list-req-units').value);
    
    stagedRequests.push({ bloodGroup: bg, units: units });
    renderRequestList();
}

function removeRequestFromList(index) {
    stagedRequests.splice(index, 1);
    renderRequestList();
}

function clearRequestList() {
    stagedRequests = [];
    renderRequestList();
}

function renderRequestList() {
    const list = document.getElementById('multi-request-list');
    list.innerHTML = '';
    
    if (stagedRequests.length === 0) {
        list.innerHTML = '<li id="empty-req-msg" style="color: var(--text-muted); text-align: center; margin-top: 30px;">No items added yet.</li>';
        return;
    }
    
    stagedRequests.forEach((req, idx) => {
        list.innerHTML += `
            <li style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid var(--dark-border);">
                <span><strong style="color: var(--primary-red);">${req.bloodGroup}</strong> - ${req.units} units</span>
                <button class="btn secondary-btn" style="padding: 5px 10px; margin: 0; border-color: var(--primary-red); color: var(--primary-red);" onclick="removeRequestFromList(${idx})">X</button>
            </li>
        `;
    });
}

async function submitMultiRequest() {
    if (stagedRequests.length === 0) {
        alert("Please add at least one request to the list first.");
        return;
    }
    
    const btn = document.getElementById('submit-multi-btn');
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = 'Submitting...';
    
    try {
        for (const req of stagedRequests) {
            await fetch('/api/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bloodGroup: req.bloodGroup,
                    units: req.units,
                    bankName: currentUser.username,
                    latitude: userLocation ? userLocation.lat : 0,
                    longitude: userLocation ? userLocation.lng : 0,
                    type: 'REQUEST'
                })
            });
        }
        
        alert(`Successfully submitted ${stagedRequests.length} requests!`);
        clearRequestList();
        loadMapData(); // Refresh UI
        if (currentRole === 'BLOOD_BANK') {
            loadBankInventory();
        }
    } catch (err) {
        alert("Server error while submitting requests.");
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
}

async function submitBloodAction(type) {
    const isReq = type === 'REQUEST';
    const bg = document.getElementById('request-blood-group').value;
    const btn = document.getElementById('raise-req-btn');
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
                latitude: userLocation ? userLocation.lat : 0,
                longitude: userLocation ? userLocation.lng : 0,
                type: type
            })
        });

        if (res.ok) {
            alert(`Successfully declared ${bg} as urgently needed!`);
            if (currentRole === 'BLOOD_BANK') {
                loadBankInventory();
            }
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

async function updateInventory(action) {
    const bg = document.getElementById('update-inv-bg').value;
    const units = parseInt(document.getElementById('update-inv-units').value);
    
    if (isNaN(units) || units < 1) {
        alert("Please enter a valid number of units.");
        return;
    }
    
    const btn = action === 'add' ? document.getElementById('add-inv-btn') : document.getElementById('remove-inv-btn');
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = 'Updating...';

    try {
        const res = await fetch(`/api/requests/inventory/update?bankName=${encodeURIComponent(currentUser.username)}&bloodGroup=${encodeURIComponent(bg)}&units=${units}&action=${action}`, {
            method: 'POST'
        });

        if (res.ok) {
            alert(`Successfully updated inventory for ${bg}.`);
            if (currentRole === 'BLOOD_BANK') {
                loadBankInventory();
                loadMapData();
            }
        } else {
            alert('Failed to update inventory');
        }
    } catch (err) {
        alert('Server error.');
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
}

async function loadBankInventory() {
    try {
        const [reqRes, availRes] = await Promise.all([
            fetch('/api/requests?type=REQUEST'),
            fetch('/api/requests?type=AVAILABLE')
        ]);
        
        let requests = await reqRes.json();
        let available = await availRes.json();
        
        requests = requests.filter(r => r.bankName === currentUser.username);
        available = available.filter(r => r.bankName === currentUser.username);
        
        const listDiv = document.getElementById('bank-inventory-list');
        if(!listDiv) return;
        listDiv.innerHTML = '';
        
        requests.forEach(req => {
            listDiv.innerHTML += `
                <div style="background: rgba(255,75,75,0.2); border: 1px solid var(--primary-red); padding: 10px; border-radius: 5px;">
                    <strong style="color:var(--primary-red);">Urgent Need: ${req.bloodGroup}</strong>
                </div>
            `;
        });
        
        available.forEach(avail => {
            listDiv.innerHTML += `
                <div style="background: rgba(74,144,226,0.2); border: 1px solid #4a90e2; padding: 10px; border-radius: 5px;">
                    <strong style="color:#4a90e2;">Available: ${avail.bloodGroup}</strong>
                </div>
            `;
        });
        
    } catch (err) {
        console.error("Failed to load bank inventory", err);
    }
}

function logout() {
    currentUser = null;
    currentRole = null;
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    showView('landing');
}

function showView(viewName) {
    if (landingView) landingView.classList.add('hidden');
    authView.classList.add('hidden');
    profileView.classList.add('hidden');
    dashboardView.classList.add('hidden');
    
    if (landingView) landingView.classList.remove('active');
    authView.classList.remove('active');
    profileView.classList.remove('active');
    dashboardView.classList.remove('active');

    if (viewName === 'landing') {
        if (landingView) {
            landingView.classList.remove('hidden');
            landingView.classList.add('active');
        }
    } else if (viewName === 'auth') {
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
