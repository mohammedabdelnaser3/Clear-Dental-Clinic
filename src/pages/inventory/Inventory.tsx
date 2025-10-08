import React from 'react';
import InventoryDashboard from '../../components/inventory/InventoryDashboard';
import { useAuth } from '../../hooks/useAuth';

const Inventory: React.FC = () => {
  const { user } = useAuth();
  
  // Get clinic ID if user is assigned to a specific clinic
  const clinicId = user?.assignedClinics && user.assignedClinics.length > 0 
    ? user.assignedClinics[0] 
    : undefined;

  return <InventoryDashboard clinicId={clinicId} />;
};

export default Inventory;





