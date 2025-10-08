import { Medication } from '../models';
import { connectDB } from '../config/database';

interface MedicationData {
  name: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  sideEffects: string[];
  contraindications: string[];
  category: 'antibiotic' | 'painkiller' | 'anti-inflammatory' | 'anesthetic' | 'antiseptic' | 'other';
  isActive: boolean;
}

const medicationsData: MedicationData[] = [
  {
    name: 'Ibuprofen',
    genericName: 'Ibuprofen',
    dosage: '200mg, 400mg, 600mg',
    frequency: '3-4 times daily',
    duration: '3-5 days',
    instructions: 'Take with food or milk to prevent stomach irritation. OTC, commonly used for headaches, muscle pain',
    sideEffects: ['Stomach upset', 'Heartburn', 'Dizziness', 'Headache'],
    contraindications: ['Stomach ulcers', 'Kidney disease', 'Heart disease'],
    category: 'anti-inflammatory',
    isActive: true
  },
  {
    name: 'Amoxicillin',
    genericName: 'Amoxicillin',
    dosage: '250mg, 500mg',
    frequency: '3 times daily',
    duration: '7-10 days',
    instructions: 'Take with food to reduce stomach upset. Used for ear infections, sinusitis',
    sideEffects: ['Nausea', 'Diarrhea', 'Stomach upset', 'Allergic reactions'],
    contraindications: ['Penicillin allergy', 'Severe kidney disease'],
    category: 'antibiotic',
    isActive: true
  },
  {
    name: 'Lisinopril',
    genericName: 'Lisinopril',
    dosage: '5mg, 10mg, 20mg',
    frequency: 'Once daily',
    duration: 'Long-term',
    instructions: 'ACE inhibitor, monitor for cough. For blood pressure control',
    sideEffects: ['Dry cough', 'Dizziness', 'Headache', 'Fatigue'],
    contraindications: ['ACE inhibitor allergy', 'Pregnancy', 'Severe kidney disease'],
    category: 'other',
    isActive: true
  },
  {
    name: 'Metformin',
    genericName: 'Metformin HCl',
    dosage: '500mg, 850mg, 1000mg',
    frequency: '2-3 times daily',
    duration: 'Long-term',
    instructions: 'Take with meals. Monitor for GI side effects. For type 2 diabetes',
    sideEffects: ['Nausea', 'Diarrhea', 'Stomach upset', 'Metallic taste'],
    contraindications: ['Severe kidney disease', 'Liver disease', 'Heart failure'],
    category: 'other',
    isActive: true
  },
  {
    name: 'Albuterol',
    genericName: 'Albuterol Sulfate',
    dosage: '90mcg/inhalation',
    frequency: 'As needed',
    duration: 'As needed',
    instructions: 'Inhaler, used as needed for wheezing. For asthma/COPD',
    sideEffects: ['Tremor', 'Nervousness', 'Headache', 'Throat irritation'],
    contraindications: ['Severe heart conditions', 'Hyperthyroidism'],
    category: 'other',
    isActive: true
  },
  {
    name: 'Lidocaine',
    genericName: 'Lidocaine HCl',
    dosage: '2%',
    frequency: 'As needed',
    duration: 'Single application',
    instructions: 'Apply topically to affected area',
    sideEffects: ['Local irritation', 'Numbness', 'Allergic reactions'],
    contraindications: ['Lidocaine allergy', 'Severe heart conditions'],
    category: 'anesthetic',
    isActive: true
  },
  {
    name: 'Chlorhexidine',
    genericName: 'Chlorhexidine Gluconate',
    dosage: '0.12%',
    frequency: '2 times daily',
    duration: '7-14 days',
    instructions: 'Rinse mouth for 30 seconds, do not swallow',
    sideEffects: ['Tooth staining', 'Altered taste', 'Mouth irritation'],
    contraindications: ['Chlorhexidine allergy'],
    category: 'antiseptic',
    isActive: true
  },
  {
    name: 'Acetaminophen',
    genericName: 'Paracetamol',
    dosage: '500mg',
    frequency: '4 times daily',
    duration: '3-5 days',
    instructions: 'Do not exceed 4000mg in 24 hours',
    sideEffects: ['Rare allergic reactions', 'Liver damage with overdose'],
    contraindications: ['Severe liver disease', 'Alcohol dependency'],
    category: 'painkiller',
    isActive: true
  },
  {
    name: 'Clindamycin',
    genericName: 'Clindamycin HCl',
    dosage: '300mg',
    frequency: '4 times daily',
    duration: '7-10 days',
    instructions: 'Take with full glass of water',
    sideEffects: ['Diarrhea', 'Nausea', 'Abdominal pain', 'C. diff colitis'],
    contraindications: ['Clindamycin allergy', 'History of C. diff infection'],
    category: 'antibiotic',
    isActive: true
  }
];

export const seedMedications = async (): Promise<void> => {
  try {
    // Check if medications already exist
    const existingCount = await (Medication as any).countDocuments();
    
    if (existingCount > 0) {
      console.log(`✅ Medications already seeded (${existingCount} medications found)`);
      return;
    }

    // Insert medications
    await (Medication as any).insertMany(medicationsData);
    
    console.log(`✅ Successfully seeded ${medicationsData.length} medications`);
    
  } catch (error) {
    console.error('❌ Error seeding medications:', error);
    throw error;
  }
};

// Run seeder if called directly
if (require.main === module) {
  const runSeeder = async () => {
    try {
      await connectDB();
      await seedMedications();
      console.log('🎉 Medication seeder completed successfully!');
      process.exit(0);
    } catch (error) {
      console.error('💥 Medication seeder failed:', error);
      process.exit(1);
    }
  };
  
  runSeeder();
}