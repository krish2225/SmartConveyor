import React from 'react';
import ConveyorScene from '../components/digital-twin/ConveyorScene.jsx';
import { Card } from '../components/ui/card.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Boxes, Info, ShieldAlert, Cpu } from 'lucide-react';

export default function DigitalTwin({
  facilityId = 'nmdc-kirandul-cv101',
  joints = [],
  selectedJointId = 'Joint-05',
  onSelectJoint,
  telemetry
}) {
  return (
    <div className="space-y-4 animate-fade-in select-none">
      
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-primary/10 border border-primary/30 rounded-lg text-primary shadow-xs">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
              <span>3D Interactive Digital Twin</span>
              <Badge variant="cyan" size="sm" className="font-mono text-[9px] py-0 px-1">
                WebGL 60FPS
              </Badge>
            </h1>
            <p className="text-xs text-muted-foreground font-mono">
              NMDC Conveyor CV-101 (1200m Loop) • Real-Time Splice Mesh Raycaster &amp; Structural Kinematics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="cyan" className="font-mono text-xs shadow-xs">
            Speed: {telemetry?.sensors?.belt_speed || 4.2} m/s
          </Badge>
          <Badge variant="warning" className="font-mono text-xs shadow-xs">
            Load: {telemetry?.sensors?.dynamic_load || 1850} t/h
          </Badge>
        </div>
      </div>

      {/* 3D Scene Viewport Component */}
      <ConveyorScene
        facilityId={facilityId}
        joints={joints}
        selectedJointId={selectedJointId}
        onSelectJoint={onSelectJoint}
        beltSpeedMps={telemetry?.sensors?.belt_speed || 4.2}
        dynamicLoadTph={telemetry?.sensors?.dynamic_load || 1850}
        activeJointId={telemetry?.activeJointId || 'Joint-01'}
      />

      {/* Industrial Specifications Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        
        <Card className="p-3.5 bg-surface border-border shadow-xs space-y-1 transition-colors">
          <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-primary" />
            ST-5400 Steel Cord Belt Architecture
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed font-mono">
            1600mm width, heavy-duty vulcanized rubber cover, 6 step-lap splices circulating continuously at 4.2 m/s.
          </p>
        </Card>

        <Card className="p-3.5 bg-surface border-border shadow-xs space-y-1 transition-colors">
          <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            Joint Rupture Early Warning System
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed font-mono">
            Joint-05 exhibits core delamination with 14.2mm residual splice thickness (Mandatory threshold: 15.0mm).
          </p>
        </Card>

        <Card className="p-3.5 bg-surface border-border shadow-xs space-y-1 transition-colors">
          <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Info className="w-4 h-4 text-primary" />
            Synchronized 3D Texture Engine
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed font-mono">
            Belt mesh linear translation speed is dynamically synchronized to the physical rotary tachometer stream.
          </p>
        </Card>

      </div>

    </div>
  );
}
