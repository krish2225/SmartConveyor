"""
SmartConveyor - SIH Problem Statement 26008 (NMDC Iron Ore Mining)
Synthetic Degradation and Sensor Telemetry Generator
Generates realistic multi-sensor conveyor belt joint degradation data,
simulating steel-cord fatigue, vulcanized rubber hardening, splice elongation,
and hopper chute ore dump impact shocks.
"""

import numpy as np
import pandas as pd
import math

def generate_rul_training_data(num_cycles=2000, random_seed=42):
    """
    Generates time-to-failure degradation curves for conveyor joints.
    Physics model: Exponential degradation + Weibull wear phase + stress shock events.
    """
    np.random.seed(random_seed)
    
    samples = []
    for joint_id in range(1, 51):  # 50 simulated joint lifecycles
        max_lifetime_hours = np.random.uniform(3500, 7200) # Typical splice life in iron ore mines
        time_steps = np.linspace(0, max_lifetime_hours, num=np.random.randint(80, 150))
        
        # Initial health parameters
        base_vibration = np.random.uniform(1.2, 2.0)
        base_temp = np.random.uniform(38.0, 46.0)
        base_thickness = np.random.uniform(24.5, 26.0) # mm
        base_acoustic = np.random.uniform(32.0, 42.0) # dB
        
        for t in time_steps:
            progress = t / max_lifetime_hours  # 0.0 (brand new) to 1.0 (rupture point)
            rul_hours = max(0.0, max_lifetime_hours - t)
            
            # Physics-based non-linear degradation progression
            wear_factor = progress ** 2.2
            
            # Simulated sensor values with Gaussian noise
            vibration = base_vibration + 6.5 * wear_factor + np.random.normal(0, 0.15)
            temperature = base_temp + 38.0 * (progress ** 1.8) + np.random.normal(0, 0.8)
            thickness = base_thickness - 9.5 * wear_factor + np.random.normal(0, 0.1) # Worn splice thinning
            acoustic_db = base_acoustic + 45.0 * (progress ** 2.5) + np.random.normal(0, 1.2)
            load_tph = np.random.uniform(1600, 2400)
            speed_mps = np.random.uniform(4.0, 4.3)
            
            # Calculate composite risk score (0 to 100)
            risk_score = min(100.0, max(0.0, (progress ** 1.9) * 100.0 + np.random.normal(0, 1.5)))
            
            samples.append({
                "joint_id": f"J-{joint_id:03d}",
                "operating_hours": round(t, 2),
                "vibration_rms": round(max(0.1, vibration), 3),
                "joint_temperature": round(temperature, 2),
                "ultrasonic_thickness": round(max(5.0, thickness), 2),
                "acoustic_emission": round(max(10.0, acoustic_db), 2),
                "dynamic_load_tph": round(load_tph, 1),
                "belt_speed_mps": round(speed_mps, 2),
                "risk_score": round(risk_score, 2),
                "rul_hours": round(rul_hours, 2),
                "rul_days": round(rul_hours / 24.0, 2)
            })
            
    df = pd.DataFrame(samples)
    return df


def generate_anomaly_training_data(num_samples=5000, random_seed=42):
    """
    Generates training data for anomaly detection:
    - Normal steady state
    - Dump load impact window (high load + transient vibration, NOT a defect)
    - True joint splice defect (vibration spike + acoustic crack emission)
    - Thermal hotspot defect
    """
    np.random.seed(random_seed)
    data = []
    
    for i in range(num_samples):
        mode = np.random.choice(["normal", "dump_event", "splice_defect", "thermal_anomaly"], p=[0.70, 0.15, 0.10, 0.05])
        
        if mode == "normal":
            vibration = np.random.normal(2.5, 0.5)
            load = np.random.normal(1800, 150)
            temp = np.random.normal(48, 4)
            acoustic = np.random.normal(40, 5)
            is_dumping = 0
            is_anomaly = 0
            
        elif mode == "dump_event":
            # Ore dumping from chute: load surges, transient vibration spike, but normal temperature and acoustic signature
            vibration = np.random.normal(6.2, 1.2)
            load = np.random.normal(2550, 120)
            temp = np.random.normal(49, 3)
            acoustic = np.random.normal(44, 4)
            is_dumping = 1
            is_anomaly = 0 # Handled by dump filter!
            
        elif mode == "splice_defect":
            # True joint rupture precursor: sustained vibration harmonic + high acoustic emission + cord stress
            vibration = np.random.normal(7.8, 1.5)
            load = np.random.normal(1900, 180)
            temp = np.random.normal(65, 8)
            acoustic = np.random.normal(78, 6)
            is_dumping = 0
            is_anomaly = 1
            
        else: # thermal_anomaly
            vibration = np.random.normal(4.0, 0.8)
            load = np.random.normal(2000, 150)
            temp = np.random.normal(88, 7)
            acoustic = np.random.normal(55, 6)
            is_dumping = 0
            is_anomaly = 1
            
        data.append({
            "vibration_rms": max(0.1, vibration),
            "dynamic_load_tph": max(0, load),
            "joint_temperature": temp,
            "acoustic_emission": acoustic,
            "is_dumping": is_dumping,
            "is_anomaly": is_anomaly
        })
        
    return pd.DataFrame(data)

if __name__ == "__main__":
    df_rul = generate_rul_training_data()
    df_anom = generate_anomaly_training_data()
    print(f"Generated RUL dataset: {len(df_rul)} rows")
    print(f"Generated Anomaly dataset: {len(df_anom)} rows")
