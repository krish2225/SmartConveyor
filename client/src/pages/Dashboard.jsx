import React from 'react';
import HealthRiskGauge from '../components/dashboard/HealthRiskGauge.jsx';
import SensorCard from '../components/dashboard/SensorCard.jsx';
import AlertFeed from '../components/dashboard/AlertFeed.jsx';
import TelemetryChart from '../components/dashboard/TelemetryChart.jsx';
import { SENSOR_TYPES } from '../../../shared/constants.js';

export default function Dashboard({
  facilityId,
  telemetry,
  telemetryHistory,
  joints,
  overallRiskScore,
  minRulDays,
  criticalCount,
  warningCount,
  healthyCount,
  alerts,
  reliabilityScores,
  currentUser,
  onInvestigateJoint
}) {
  const sensors = telemetry?.sensors || {};

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Main Row: Health Risk Gauge (Plant RUL) */}
      <HealthRiskGauge
        riskScore={overallRiskScore}
        estimatedTimeToFailureDays={minRulDays}
        criticalCount={criticalCount}
        warningCount={warningCount}
        healthyCount={healthyCount}
        activeJointId={telemetry?.activeJointId || 'Joint-05'}
      />

      {/* 6 Live Sensor Cards Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
            Live Physical Sensor Transducer Telemetry (20Hz)
          </h3>
          <span className="text-[11px] font-mono text-cyan-400">
            Active Splice: {telemetry?.activeJointId || 'Joint-01'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
          <SensorCard
            sensorType={SENSOR_TYPES.DRIVE_VIBRATION}
            currentValue={sensors[SENSOR_TYPES.DRIVE_VIBRATION]}
            history={telemetryHistory}
            reliabilityScore={reliabilityScores[SENSOR_TYPES.DRIVE_VIBRATION]?.reliabilityScore || 94}
          />
          <SensorCard
            sensorType={SENSOR_TYPES.BELT_SPEED}
            currentValue={sensors[SENSOR_TYPES.BELT_SPEED]}
            history={telemetryHistory}
            reliabilityScore={reliabilityScores[SENSOR_TYPES.BELT_SPEED]?.reliabilityScore || 98}
          />
          <SensorCard
            sensorType={SENSOR_TYPES.DYNAMIC_LOAD}
            currentValue={sensors[SENSOR_TYPES.DYNAMIC_LOAD]}
            history={telemetryHistory}
            reliabilityScore={reliabilityScores[SENSOR_TYPES.DYNAMIC_LOAD]?.reliabilityScore || 91}
          />
          <SensorCard
            sensorType={SENSOR_TYPES.JOINT_TEMPERATURE}
            currentValue={sensors[SENSOR_TYPES.JOINT_TEMPERATURE]}
            history={telemetryHistory}
            reliabilityScore={reliabilityScores[SENSOR_TYPES.JOINT_TEMPERATURE]?.reliabilityScore || 89}
          />
          <SensorCard
            sensorType={SENSOR_TYPES.ULTRASONIC_THICKNESS}
            currentValue={sensors[SENSOR_TYPES.ULTRASONIC_THICKNESS]}
            history={telemetryHistory}
            reliabilityScore={reliabilityScores[SENSOR_TYPES.ULTRASONIC_THICKNESS]?.reliabilityScore || 78}
          />
          <SensorCard
            sensorType={SENSOR_TYPES.ACOUSTIC_EMISSION}
            currentValue={sensors[SENSOR_TYPES.ACOUSTIC_EMISSION]}
            history={telemetryHistory}
            reliabilityScore={reliabilityScores[SENSOR_TYPES.ACOUSTIC_EMISSION]?.reliabilityScore || 92}
          />
        </div>
      </div>

      {/* Bottom Grid: Telemetry Time-Series Chart (2 cols) & Live Alert Feed (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TelemetryChart
            telemetryHistory={telemetryHistory}
            isDumping={telemetry?.isDumping}
          />
        </div>

        <div className="lg:col-span-1">
          <AlertFeed
            alerts={alerts}
            facilityId={facilityId}
            currentUser={currentUser}
            onInvestigateJoint={onInvestigateJoint}
          />
        </div>
      </div>

    </div>
  );
}
