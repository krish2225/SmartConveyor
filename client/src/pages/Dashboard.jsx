import React from 'react';
import { useNavigate } from 'react-router-dom';
import HealthRiskGauge from '../components/dashboard/HealthRiskGauge.jsx';
import SensorCard from '../components/dashboard/SensorCard.jsx';
import AlertFeed from '../components/dashboard/AlertFeed.jsx';
import TelemetryChart from '../components/dashboard/TelemetryChart.jsx';
import TopSystemStatusStrip from '../components/shared/TopSystemStatusStrip.jsx';
import { SENSOR_TYPES } from '../../../shared/constants.js';
import { Activity, Radio, ShieldCheck, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/button.jsx';
import { Badge } from '../components/ui/badge.jsx';

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
  alerts = [],
  reliabilityScores = {},
  fleetAverageScore = 92,
  currentUser,
  onInvestigateJoint,
  onAcknowledgeAlert
}) {
  const navigate = useNavigate();
  const sensors = telemetry?.sensors || {};
  const activeAlertCount = alerts.filter(a => a.status === 'ACTIVE').length;
  const criticalAlertCount = alerts.filter(a => a.status === 'ACTIVE' && a.severity === 'CRITICAL').length;
  const currentBeltSpeed = sensors[SENSOR_TYPES.BELT_SPEED] || 4.15;

  return (
    <div className="space-y-4 animate-fade-in select-none">
      
      {/* 1. Top Industrial System Status Strip */}
      <TopSystemStatusStrip
        facilityId={facilityId}
        deviceId="CB_001"
        sensorCount={Object.keys(sensors).length || 6}
        activeAlertCount={activeAlertCount}
        criticalAlertCount={criticalAlertCount}
        isOnline={true}
        lastSyncSecondsAgo={1}
        activeJointId={telemetry?.activeJointId || 'Joint-05'}
        beltSpeed={currentBeltSpeed}
      />

      {/* 2. Top Main KPI Section: Health Risk Gauge & Machine RUL */}
      <HealthRiskGauge
        riskScore={overallRiskScore}
        estimatedTimeToFailureDays={minRulDays}
        criticalCount={criticalCount}
        warningCount={warningCount}
        healthyCount={healthyCount}
        activeJointId={telemetry?.activeJointId || 'Joint-05'}
      />

      {/* 3. Sensor Fleet Reliability & Health Status Banner */}
      <div className="p-3 bg-surface border border-border rounded-lg shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">Sensor Fleet Health &amp; Telemetry Integrity</span>
              <Badge variant="nominal" size="sm" className="font-mono text-[9px] px-1.5 py-0">
                {fleetAverageScore}% AVG QUALITY
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground font-mono">
              Physics Quality Validation • 5/6 Channels 100% Nominal • 1 Ultrasonic Downweighted (0.78x)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/sensor-health')}
            className="text-xs font-mono gap-1.5 h-8 border-border hover:border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 font-semibold"
          >
            <span>Inspect Sensor Health</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* 4. 6 Live Physical Sensor Transducer Telemetry Cards Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-0.5">
          <h3 className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Live Multi-Axis Transducer Network (20Hz • ESP32 Wireless Node)</span>
          </h3>
          <span className="text-[11px] font-mono text-cyan-400 font-bold">
            Splice Under Inspection: {telemetry?.activeJointId || 'Joint-05'}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
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

      {/* 5. Bottom Grid: Telemetry Time-Series Chart (2 cols) & Live Alert Feed (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
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
            onAcknowledgeAlert={onAcknowledgeAlert}
          />
        </div>
      </div>

    </div>
  );
}
