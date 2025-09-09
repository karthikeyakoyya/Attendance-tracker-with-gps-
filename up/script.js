document.addEventListener('DOMContentLoaded', function() {
    
    // --- DYNAMICALLY POPULATE USER DETAILS FROM SESSION ---
    const userNameEl = document.getElementById('user-name');
    const userIdEl = document.getElementById('user-id');
    
    // 1. Get the logged-in user's data from sessionStorage
    const loggedInUserData = JSON.parse(sessionStorage.getItem('loggedInUser'));

    // 2. Check if user data exists. If not, redirect to login page for security.
    if (!loggedInUserData) {
        alert('You are not logged in. Redirecting to login page.');
        window.location.href = 'login.html';
        return; // Stop executing the rest of the script
    }

    // 3. Populate the user profile card with the stored data
    userNameEl.textContent = loggedInUserData.name;
    userIdEl.textContent = `ID: ${loggedInUserData.rollNo}`;
    // --- END OF DYNAMIC CODE ---


    // College coordinates and settings
    const COLLEGE_COORDS = [23.5483, 87.2914]; // NIT Durgapur coordinates
    const GEOFENCE_RADIUS = 500; // 500 meters radius around campus
    const MAX_ATTENDANCE_TIME = 30; // Max minutes after class start to mark present
    
    // DOM Elements
    const cameraBtn = document.getElementById('camera-btn');
    const cameraFeed = document.getElementById('camera-feed');
    const cameraPlaceholder = document.getElementById('camera-placeholder');
    const captureBtn = document.getElementById('capture-btn');
    const photoCanvas = document.getElementById('photo-canvas');
    const cameraStatus = document.getElementById('camera-status');
    const locationBtn = document.getElementById('location-btn');
    const locationStatus = document.getElementById('location-status');
    const locationText = document.getElementById('location-text');
    const attendanceStatus = document.getElementById('attendanceStatus');
    const attendanceForm = document.getElementById('attendanceForm');
    const simulateFingerprint = document.getElementById('simulate-fingerprint');
    const fingerprintStatus = document.getElementById('fingerprint-status');
    const attendanceTableBody = document.getElementById('attendanceTableBody');
    const toastEl = document.getElementById('attendanceToast');
    const toastBody = document.getElementById('toast-message');
    const mapContainer = document.getElementById('map');


    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('attendanceDate').value = today;

    // Initialize map centered on NIT Durgapur
    const map = L.map('map').setView(COLLEGE_COORDS, 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Add college marker and geofence circle
    const collegeMarker = L.marker(COLLEGE_COORDS).addTo(map)
        .bindPopup('<b>NIT Durgapur</b><br>Attendance Zone')
        .openPopup();

    L.circle(COLLEGE_COORDS, {
        radius: GEOFENCE_RADIUS,
        className: 'geofence-circle'
    }).addTo(map);

    // Camera functionality
    cameraBtn.addEventListener('click', async function() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            cameraFeed.srcObject = stream;
            cameraFeed.style.display = 'block';
            cameraPlaceholder.style.display = 'none';
            captureBtn.style.display = 'block';
            cameraStatus.className = 'badge bg-info';
            cameraStatus.textContent = 'Active';
        } catch (err) {
            console.error("Camera error: ", err);
            cameraStatus.className = 'badge bg-danger';
            cameraStatus.textContent = 'Failed';
            showToast('Failed to access camera. Please check permissions.', 'danger');
        }
    });

    captureBtn.addEventListener('click', function() {
        photoCanvas.width = cameraFeed.videoWidth;
        photoCanvas.height = cameraFeed.videoHeight;
        const context = photoCanvas.getContext('2d');
        context.drawImage(cameraFeed, 0, 0, photoCanvas.width, photoCanvas.height);
        
        // Stop camera stream
        const stream = cameraFeed.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        
        cameraFeed.style.display = 'none';
        captureBtn.style.display = 'none';
        cameraStatus.className = 'badge bg-success';
        cameraStatus.textContent = 'Verified';
        showToast('Photo captured successfully!');
    });

    // Location verification with geofencing
    locationBtn.addEventListener('click', function() {
        mapContainer.style.display = 'block';
        map.invalidateSize(); 

        if (navigator.geolocation) {
            locationStatus.className = 'badge bg-info';
            locationStatus.textContent = 'Locating...';
            locationText.textContent = 'Checking your location...';
            
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    const userLat = position.coords.latitude;
                    const userLng = position.coords.longitude;
                    const userCoords = [userLat, userLng];
                    
                    const distance = calculateDistance(
                        COLLEGE_COORDS[0], COLLEGE_COORDS[1],
                        userLat, userLng
                    );
                    
                    map.setView(userCoords);
                    
                    map.eachLayer(layer => {
                        if (layer instanceof L.Marker && layer !== collegeMarker) {
                            map.removeLayer(layer);
                        }
                        if (layer instanceof L.Polyline) {
                            map.removeLayer(layer);
                        }
                    });
                    
                    L.marker(userCoords).addTo(map)
                        .bindPopup(`Your location (${distance.toFixed(0)}m from campus)`);
                    
                    L.polyline([COLLEGE_COORDS, userCoords], {
                        color: 'red',
                        dashArray: '5,5'
                    }).addTo(map);
                    
                    if (distance <= GEOFENCE_RADIUS) {
                        const currentTime = new Date();
                        const currentHour = currentTime.getHours();
                        const currentMinute = currentTime.getMinutes();
                        
                        const isLate = currentHour > 9 || (currentHour === 9 && currentMinute > MAX_ATTENDANCE_TIME);
                        
                        locationText.innerHTML = `Location: <span class="text-success">On Campus (${distance.toFixed(0)}m from center)</span>`;
                        locationStatus.className = 'badge bg-success';
                        locationStatus.textContent = 'Verified';
                        
                        if (attendanceStatus.value === '') {
                            attendanceStatus.value = isLate ? 'late' : 'present';
                        }
                        
                        showToast(`Location verified - you are ${isLate ? 'late but ' : ''}on campus!`);
                    } else {
                        locationText.innerHTML = `Location: <span class="location-warning">Off Campus (${distance.toFixed(0)}m away)</span>`;
                        locationStatus.className = 'badge bg-danger';
                        locationStatus.textContent = 'Outside';
                        
                        attendanceStatus.value = 'absent';
                        
                        showToast('You are outside campus boundaries! Attendance marked as absent.', 'danger');
                    }
                },
                function(error) {
                    console.error("Geolocation error: ", error);
                    locationStatus.className = 'badge bg-danger';
                    locationStatus.textContent = 'Failed';
                    locationText.textContent = 'Location access denied or unavailable';
                    showToast('Failed to get location. Please enable location services.', 'warning');
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        } else {
            locationStatus.className = 'badge bg-danger';
            locationStatus.textContent = 'Unavailable';
            locationText.textContent = 'Geolocation not supported by your browser';
            showToast('Geolocation is not supported by your browser.', 'warning');
        }
    });

    // Fingerprint simulation
    simulateFingerprint.addEventListener('click', function() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('fingerprintModal'));
        
        setTimeout(function() {
            modal.hide();
            fingerprintStatus.className = 'badge bg-success';
            fingerprintStatus.textContent = 'Verified';
            showToast('Fingerprint verified successfully!');
        }, 2000);
    });

    // Attendance form submission
    attendanceForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (cameraStatus.textContent !== 'Verified' || 
            fingerprintStatus.textContent !== 'Verified' || 
            locationStatus.textContent === 'Pending') {
            showToast('Please complete all verification methods before submitting.', 'warning');
            return;
        }
        
        const status = attendanceStatus.value;
        if (locationStatus.textContent === 'Outside' && status !== 'absent') {
            showToast('Cannot mark present when outside campus!', 'danger');
            attendanceStatus.value = 'absent';
            return;
        }
        
        const date = document.getElementById('attendanceDate').value;
        const notes = document.getElementById('attendanceNotes').value;
        
        addToHistoryTable(date, status, notes);
        
        attendanceForm.reset();
        document.getElementById('attendanceDate').value = today;
        
        resetVerifications();
        
        showToast('Attendance recorded successfully!');
    });

    // Load sample attendance history
    loadSampleHistory();
    
    // Filter attendance history
    document.querySelectorAll('.dropdown-item[data-filter]').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const filter = this.getAttribute('data-filter');
            filterHistoryTable(filter);
        });
    });

    // Helper functions
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Earth radius in meters
        const φ1 = lat1 * Math.PI/180;
        const φ2 = lat2 * Math.PI/180;
        const Δφ = (lat2-lat1) * Math.PI/180;
        const Δλ = (lon2-lon1) * Math.PI/180;
        
        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        
        return R * c;
    }

    function showToast(message, type = 'success') {
        toastBody.textContent = message;
        toastEl.className = `toast show bg-${type}`;
        
        const bsToast = new bootstrap.Toast(toastEl);
        bsToast.show();
    }

    function addToHistoryTable(date, status, notes) {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        
        let statusBadge;
        switch(status) {
            case 'present': 
                statusBadge = '<span class="badge bg-success">Present</span>'; 
                break;
            case 'absent': 
                statusBadge = '<span class="badge bg-danger">Absent</span>'; 
                break;
            case 'late': 
                statusBadge = '<span class="badge bg-warning">Late</span>'; 
                break;
            case 'excused': 
                statusBadge = '<span class="badge bg-info">Excused</span>'; 
                break;
        }
        
        let verificationMethods = [];
        if (cameraStatus.textContent === 'Verified') verificationMethods.push('Camera');
        if (fingerprintStatus.textContent === 'Verified') verificationMethods.push('Fingerprint');
        if (locationStatus.textContent === 'Verified') verificationMethods.push('Location');
        
        const row = `
            <tr data-status="${status}">
                <td>${date}</td>
                <td>${statusBadge}</td>
                <td>${timeString}</td>
                <td>${locationText.textContent.replace('Location: ', '')}</td>
                <td>${verificationMethods.join(', ') || 'None'}</td>
                <td>${notes || '-'}</td>
            </tr>
        `;
        
        attendanceTableBody.insertAdjacentHTML('afterbegin', row);
    }

    function loadSampleHistory() {
        const sampleData = [
            { 
                date: '2025-08-05', 
                status: 'present', 
                time: '09:05:23', 
                location: 'On Campus (120m from center)', 
                verification: 'Camera, Location, Fingerprint',
                notes: 'On time' 
            },
            { 
                date: '2025-08-04', 
                status: 'late', 
                time: '09:35:12', 
                location: 'On Campus (80m from center)', 
                verification: 'Camera, Location, Fingerprint',
                notes: 'Traffic delay' 
            },
            { 
                date: '2025-08-03', 
                status: 'absent', 
                time: '-', 
                location: 'Off Campus (1200m away)', 
                verification: 'None',
                notes: 'Sick leave' 
            }
        ];
        
        sampleData.forEach(data => {
            let statusBadge;
            switch(data.status) {
                case 'present': statusBadge = '<span class="badge bg-success">Present</span>'; break;
                case 'absent': statusBadge = '<span class="badge bg-danger">Absent</span>'; break;
                case 'late': statusBadge = '<span class="badge bg-warning">Late</span>'; break;
                case 'excused': statusBadge = '<span class="badge bg-info">Excused</span>'; break;
            }
            
            const row = `
                <tr data-status="${data.status}">
                    <td>${data.date}</td>
                    <td>${statusBadge}</td>
                    <td>${data.time}</td>
                    <td>${data.location}</td>
                    <td>${data.verification}</td>
                    <td>${data.notes || '-'}</td>
                </tr>
            `;
            
            attendanceTableBody.insertAdjacentHTML('beforeend', row);
        });
    }

    function filterHistoryTable(filter) {
        const rows = document.querySelectorAll('#attendanceTableBody tr');
        
        rows.forEach(row => {
            if (filter === 'all') {
                row.style.display = '';
            } else {
                if (row.getAttribute('data-status') === filter) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            }
        });
    }

    function resetVerifications() {
        cameraStatus.className = 'badge bg-secondary';
        cameraStatus.textContent = 'Pending';
        fingerprintStatus.className = 'badge bg-secondary';
        fingerprintStatus.textContent = 'Pending';
        locationStatus.className = 'badge bg-secondary';
        locationStatus.textContent = 'Pending';
        locationText.textContent = 'Location not yet verified';
        
        if (cameraFeed.srcObject) {
            const stream = cameraFeed.srcObject;
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
        }
        cameraFeed.style.display = 'none';
        cameraPlaceholder.style.display = 'block';
        captureBtn.style.display = 'none';

        mapContainer.style.display = 'none';
    }
});