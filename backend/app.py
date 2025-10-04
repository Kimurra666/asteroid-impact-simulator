import json
import math
import datetime
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS

# --- Initialize Flask App ---
app = Flask(__name__)
CORS(app) 

# --- Constants from your new script ---
ASTEROID_DENSITY_KGM3 = 3500
JOULES_PER_MEGATON_TNT = 4.184e15

# --- Calculation functions from your new script ---
def get_severity_details(energy_mt):
    if energy_mt < 0.1:
        return {"band": "Local Event", "actions": ["Monitor official news.", "No immediate public action required."]}
    elif energy_mt < 10:
        return {"band": "City Level Event", "actions": ["Shelter away from windows.", "Expect shockwave.", "Follow local authority instructions."]}
    elif energy_mt < 1000:
        return {"band": "Regional Threat", "actions": ["Evacuate within precaution radius immediately.", "Seek high ground if in coastal area."]}
    else:
        return {"band": "Global Event", "actions": ["This is a globally significant event.", "Follow national emergency broadcast instructions."]}

def calculate_impact_effects(diameter_m, impact_speed_m_s, impact_angle_deg, lat, lon, impact_body="Earth", impact_in_water=False):
    if impact_body != "Earth":
        return {"impact_body": impact_body, "notes": "No direct effect on Earth expected."}
    
    radius_m = diameter_m / 2
    volume_m3 = (4/3) * math.pi * (radius_m ** 3)
    mass_kg = ASTEROID_DENSITY_KGM3 * volume_m3
    kinetic_energy_J = 0.5 * mass_kg * (impact_speed_m_s ** 2)
    impact_energy_Mt = kinetic_energy_J / JOULES_PER_MEGATON_TNT
    
    severity = get_severity_details(impact_energy_Mt)
    
    base_crater_diameter_m = 90 * (impact_energy_Mt ** (1/3))
    impact_angle_rad = np.radians(impact_angle_deg)
    crater_long_axis_m = base_crater_diameter_m / np.sin(impact_angle_rad)
    precaution_radius_km = (3 * crater_long_axis_m) / 1000
    
    is_airburst_risk = 0.1 <= impact_energy_Mt < 1000
    
    tsunami_risk = impact_in_water and impact_energy_Mt > 1
    
    output = {
        "impact_coords": {"lat": lat, "lon": lon},
        "impact_energy_Mt": impact_energy_Mt,
        "crater_details": {
            "long_axis_m_est": crater_long_axis_m,
        },
        "precaution_radius_km_est": precaution_radius_km,
        "severity_band": severity["band"],
      

        "recommended_actions": severity["actions"],
        "confidence_pct": 75,
    }
    return output

# --- API Endpoint ---
@app.route('/api/simulate', methods=['POST'])
def simulate():
    data = request.json
    
    params = {
        "diameter_m": float(data.get('diameter', 1000)),
        "impact_speed_m_s": float(data.get('speed', 20000)),
        "impact_angle_deg": float(data.get('angle', 45)),
        "lat": float(data.get('lat', 22.7196)),
        "lon": float(data.get('lon', 75.8577)),
       
    }
    
    # Run the main calculation
    results = calculate_impact_effects(**params)
    
    # Prepare a simplified response specifically for the frontend
    frontend_response = {
        "impact_coords": results["impact_coords"],
        "precaution_radius_km": results["precaution_radius_km_est"],
        "severity_alert": results["severity_band"].upper(),
        "impact_energy_Mt": f"{results['impact_energy_Mt']:,.0f} Megatons TNT",
        "crater_diameter_km": f"{results['crater_details']['long_axis_m_est'] / 1000:,.0f} km",
      
        "recommended_actions": ' '.join(results["recommended_actions"]),
        "confidence_level": f"{results['confidence_pct']}%",
    }
    
    return jsonify(frontend_response)

if __name__ == '__main__':
    app.run(debug=True, port=5000)