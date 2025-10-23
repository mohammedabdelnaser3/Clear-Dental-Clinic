import React from 'react';
import InventoryDashboard from '../../components/inventory/InventoryDashboard';
import { ClinicSelector } from '../../components/clinic';
import { useClinic } from '../../context';

const Inventory: React.FC = () => {
  const { selectedClinic } = useClinic();
  const clinicId = selectedClinic?.id; // undefined/null => All Clinics aggregated

  return (
    <div className="space-y-4">
      <ClinicSelector />
      <InventoryDashboard clinicId={clinicId} />
    </div>
  );
};

export default Inventory;





