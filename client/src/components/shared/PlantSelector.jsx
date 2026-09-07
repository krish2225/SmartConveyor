import React from 'react';
import { FACILITY_CONFIGS } from '../../../../shared/constants.js';
import { changeActiveFacility } from '../../firebase/firestore.js';
import { Building2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select.jsx';

export default function PlantSelector({ activeFacilityId, onSelectFacility }) {
  const handleValueChange = (newId) => {
    changeActiveFacility(newId);
    if (onSelectFacility) {
      onSelectFacility(newId);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={activeFacilityId} onValueChange={handleValueChange}>
        <SelectTrigger className="w-[260px] h-8 bg-surface border-border text-foreground font-medium">
          <div className="flex items-center gap-2 truncate">
            <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
            <SelectValue placeholder="Select Facility" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {Object.values(FACILITY_CONFIGS).map(facility => (
            <SelectItem key={facility.id} value={facility.id}>
              <div className="flex flex-col text-left">
                <span className="font-semibold text-xs text-foreground">{facility.shortName}</span>
                <span className="text-[10px] text-muted-foreground font-mono">{facility.plantName}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
