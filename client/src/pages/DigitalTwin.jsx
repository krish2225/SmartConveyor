import React from 'react';
import ConveyorScene from '../components/digital-twin/ConveyorScene.jsx';
import { Boxes, Info, ShieldAlert, Cpu } from 'lucide-react';

export default function DigitalTwin({
  facilityId = 'nmdc-kirandul-cv101',
  joints = [],
  selectedJointId = 'Joint-05',
  onSelectJoint,
  telemetry
}) {
  return (
    <div className="space-y-5 animate-fade-in">
      
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl text-slate-950 shadow-md">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              3D Interactive Digital Twin
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              NMDC Conveyor CV-101 (1200m Loop) • Real-Time Splice Mesh Raycaster
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-[#111726] border border-[#1f293d] text-xs font-mono text-cyan-300">
            Speed: {telemetry?.sensors?.belt_speed || 4.2} m/s
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-[#111726] border border-[#1f293d] text-xs font-mono text-orange-400">
            Load: {telemetry?.sensors?.dynamic_load || 1850} t/h
          </span>
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

      {/* Industrial Specs Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="p-4 rounded-2xl bg-[#111726] border border-[#1f293d] space-y-1">
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-cyan-400" />
            ST-5400 Steel Cord Belt Architecture
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            1600mm width, high-impact rubber cover, 6 vulcanized step-lap splices circulating at 4.2 m/s.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#111726] border border-[#1f293d] space-y-1">
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            Joint Rupture Early Warning System
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Joint-05 exhibits core delamination with 14.2mm residual splice thickness (Limit: 15.0mm).
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#111726] border border-[#1f293d] space-y-1">
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <Info className="w-4 h-4 text-cyan-400" />
            Synchronized 3D Texture Engine
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Belt mesh linear translation speed is dynamically bound to the physical tachometer stream.
          </p>
        </div>

      </div>

    </div>
  );
}
