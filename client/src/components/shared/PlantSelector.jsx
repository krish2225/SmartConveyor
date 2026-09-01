import React from 'react';
import { FACILITY_CONFIGS } from '../../../../shared/constants.js';
import { changeActiveFacility } from '../../firebase/firestore.js';
import { Building2, ChevronDown } from 'lucide-react';

export default function PlantSelector({ activeFacilityId, onSelectFacility }) {
  const current = FACILITY_CONFIGS[activeFacilityId] || Object.values(FACILITY_CONFIGS)[0];

  const handleChange = (e) => {
    const newId = e.target.value;
    changeActiveFacility(newId);
    if (onSelectFacility) {
      onSelectFacility(newId);
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <div className="flex items-center gap-2 bg-[#111726] border border-[#1f293d] hover:border-cyan-500/50 transition-all rounded-lg px-3 py-1.5 text-xs text-slate-200">
        <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
        <select
          value={activeFacilityId}
          onChange={handleChange}
          aria-label="Select Mining Complex and Conveyor Line"
          className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer pr-4 appearance-none text-xs"
        >
          {Object.values(FACILITY_CONFIGS).map(facility => (
            <option key={facility.id} value={facility.id} className="bg-[#111726] text-slate-200">
              {facility.shortName}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
      </div>
    </div>
  );
}
