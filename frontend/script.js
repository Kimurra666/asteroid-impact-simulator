document.addEventListener('DOMContentLoaded', () => {
    const simulationScreen = document.getElementById('simulation-screen');
    const resultsScreen = document.getElementById('results-screen');
    const simulateButton = document.getElementById('simulate-button');
    const backButton = document.getElementById('back-button');

    const asteroid = document.getElementById('asteroid');
    const impactFlash = document.getElementById('impact-flash');
    const simBox = document.getElementById('simulation-box-container');

    const locationInput = document.getElementById('location');
    const diameterInput = document.getElementById('diameter');
    const speedInput = document.getElementById('speed');
    const angleInput = document.getElementById('angle');
   
    const diameterValue = document.getElementById('diameter-value');
    const speedValue = document.getElementById('speed-value');
    const angleValue = document.getElementById('angle-value');
    const alertLevel = document.getElementById('alert-level');
    const impactEnergy = document.getElementById('impact-energy');
    const craterDiameter = document.getElementById('crater-diameter');
    const precautionRadius = document.getElementById('precaution-radius');

    const recommendedActions = document.getElementById('recommended-actions');
    const confidenceLevel = document.getElementById('confidence-level');

    let map = null;
    let impactMarker = null;
    let precautionCircle = null;
    
    function initializeMap() {
        if (!map) {
            map = L.map('map').setView([20, 0], 2);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; OpenStreetMap &copy; CARTO',
                maxZoom: 19
            }).addTo(map);
        }
    }

    diameterInput.addEventListener('input', () => diameterValue.textContent = `${diameterInput.value} m`);
    speedInput.addEventListener('input', () => speedValue.textContent = `${speedInput.value} m/s`);
    angleInput.addEventListener('input', () => angleValue.textContent = `${angleInput.value}°`);

    simulateButton.addEventListener('click', async () => {
        simulateButton.disabled = true;
        simBox.classList.add('hide');
        asteroid.classList.add('animate');

        await new Promise(resolve => setTimeout(resolve, 1500)); 
        impactFlash.classList.add('animate');
        await new Promise(resolve => setTimeout(resolve, 100));

        const [lat, lon] = locationInput.value.split(',').map(s => parseFloat(s.trim()));
        const simulationData = {
            lat: lat || 22.7196, lon: lon || 75.8577,
            diameter: diameterInput.value, speed: speedInput.value,
            angle: angleInput.value
            
        };

        try {
            const response = await fetch('http://127.0.0.1:5000/api/simulate', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(simulationData)
            });
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            
            const results = await response.json();
            updateResultsUI(results);
            switchToResultsScreen(results.impact_coords, results.precaution_radius_km);
        } catch (error) {
            console.error("Simulation failed:", error);
            alert("Failed to run simulation. Ensure the backend server is running.");
        }
    });
    
    backButton.addEventListener('click', () => {
        resultsScreen.classList.remove('active');
        simulationScreen.classList.add('active');
        simulateButton.disabled = false;
        simBox.classList.remove('hide');
        asteroid.classList.remove('animate');
        impactFlash.classList.remove('animate');
    });

    function updateResultsUI(data) {
        alertLevel.textContent = data.severity_alert;
        impactEnergy.textContent = data.impact_energy_Mt;
        craterDiameter.textContent = data.crater_diameter_km;
        precautionRadius.textContent = `${Math.round(data.precaution_radius_km)} km`;
  
        recommendedActions.textContent = data.recommended_actions;
        confidenceLevel.textContent = data.confidence_level;
    }

    function switchToResultsScreen(coords, radiusKm) {
        simulationScreen.classList.remove('active');
        resultsScreen.classList.add('active');
        initializeMap();
        
        setTimeout(() => {
            map.invalidateSize();
            map.setView([coords.lat, coords.lon], 6);
            if (impactMarker) map.removeLayer(impactMarker);
            if (precautionCircle) map.removeLayer(precautionCircle);
            impactMarker = L.circleMarker([coords.lat, coords.lon], { radius: 8, color: '#ff4d4d', fillColor: '#ff0000', fillOpacity: 1 }).addTo(map);
            precautionCircle = L.circle([coords.lat, coords.lon], { radius: radiusKm * 1000, color: '#ff4d4d', fillColor: '#ff0000', fillOpacity: 0.2 }).addTo(map);
        }, 10);
    }
});