import React from 'react';
import { SimpleTreatmentList } from '../../components/treatment/SimpleTreatmentList';

const Treatments: React.FC = () => {
  return <SimpleTreatmentList showPatientColumn={true} />;
};

export default Treatments;
