import mongoose from 'mongoose';
import Patient from '../models/Patient';
import User from '../models/User';
import { IPatient, IUser } from '../types';

/**
 * Migration utility to link existing patients to user accounts
 * This script matches patients to users based on email addresses
 */

export interface LinkingResult {
  totalPatients: number;
  linkedPatients: number;
  unlinkedPatients: number;
  errors: string[];
}

/**
 * Link patients to users based on matching email addresses
 */
export const linkPatientsByEmail = async (): Promise<LinkingResult> => {
  const result: LinkingResult = {
    totalPatients: 0,
    linkedPatients: 0,
    unlinkedPatients: 0,
    errors: []
  };

  try {
    // Get all patients that don't have a userId yet
    const patients = await (Patient as any).find({ 
      userId: { $exists: false },
      email: { $exists: true, $ne: null, $and: [{ $ne: '' }] }
    });

    result.totalPatients = patients.length;
    console.log(`Found ${patients.length} patients without linked user accounts`);

    for (const patient of patients) {
      try {
        if (!patient.email) continue;

        // Find user with matching email
        const user = await User.findOne({ 
          email: patient.email.toLowerCase(),
          role: 'patient'
        });

        if (user) {
          // Link patient to user
          patient.userId = user._id;
          await patient.save();
          result.linkedPatients++;
          console.log(`Linked patient ${patient.firstName} ${patient.lastName} to user ${user.email}`);
        } else {
          result.unlinkedPatients++;
          console.log(`No matching user found for patient ${patient.firstName} ${patient.lastName} (${patient.email})`);
        }
      } catch (error) {
        const errorMsg = `Error linking patient ${patient._id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    console.log('\nLinking Summary:');
    console.log(`Total patients processed: ${result.totalPatients}`);
    console.log(`Successfully linked: ${result.linkedPatients}`);
    console.log(`Unlinked (no matching user): ${result.unlinkedPatients}`);
    console.log(`Errors: ${result.errors.length}`);

    return result;
  } catch (error) {
    const errorMsg = `Fatal error during linking process: ${error instanceof Error ? error.message : 'Unknown error'}`;
    result.errors.push(errorMsg);
    console.error(errorMsg);
    return result;
  }
};

/**
 * Link patients to users based on phone numbers
 */
export const linkPatientsByPhone = async (): Promise<LinkingResult> => {
  const result: LinkingResult = {
    totalPatients: 0,
    linkedPatients: 0,
    unlinkedPatients: 0,
    errors: []
  };

  try {
    // Get all patients that don't have a userId yet
    const patients = await (Patient as any).find({ 
      userId: { $exists: false },
      phone: { $exists: true, $ne: null, $and: [{ $ne: '' }] }
    });

    result.totalPatients = patients.length;
    console.log(`Found ${patients.length} patients without linked user accounts (phone matching)`);

    for (const patient of patients) {
      try {
        if (!patient.phone) continue;

        // Find user with matching phone
        const user = await User.findOne({ 
          phone: patient.phone,
          role: 'patient'
        });

        if (user) {
          // Link patient to user
          patient.userId = user._id;
          await patient.save();
          result.linkedPatients++;
          console.log(`Linked patient ${patient.firstName} ${patient.lastName} to user ${user.phone}`);
        } else {
          result.unlinkedPatients++;
          console.log(`No matching user found for patient ${patient.firstName} ${patient.lastName} (${patient.phone})`);
        }
      } catch (error) {
        const errorMsg = `Error linking patient ${patient._id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    console.log('\nPhone Linking Summary:');
    console.log(`Total patients processed: ${result.totalPatients}`);
    console.log(`Successfully linked: ${result.linkedPatients}`);
    console.log(`Unlinked (no matching user): ${result.unlinkedPatients}`);
    console.log(`Errors: ${result.errors.length}`);

    return result;
  } catch (error) {
    const errorMsg = `Fatal error during phone linking process: ${error instanceof Error ? error.message : 'Unknown error'}`;
    result.errors.push(errorMsg);
    console.error(errorMsg);
    return result;
  }
};

/**
 * Get statistics about patient-user linking
 */
export const getLinkingStatistics = async () => {
  try {
    const totalPatients = await (Patient as any).countDocuments();
    const linkedPatients = await (Patient as any).countDocuments({ userId: { $exists: true, $ne: null } });
    const unlinkedPatients = totalPatients - linkedPatients;
    
    const totalUsers = await User.countDocuments({ role: 'patient' });
    const usersWithPatients = await (Patient as any).distinct('userId').then(userIds => userIds.filter(id => id).length);
    const usersWithoutPatients = totalUsers - usersWithPatients;

    return {
      patients: {
        total: totalPatients,
        linked: linkedPatients,
        unlinked: unlinkedPatients,
        linkingPercentage: totalPatients > 0 ? ((linkedPatients / totalPatients) * 100).toFixed(2) : '0'
      },
      users: {
        total: totalUsers,
        withPatients: usersWithPatients,
        withoutPatients: usersWithoutPatients
      }
    };
  } catch (error) {
    console.error('Error getting linking statistics:', error);
    throw error;
  }
};

/**
 * Create user accounts for patients that don't have linked users
 * This is useful for migrating existing patient data
 */
export const createUsersForUnlinkedPatients = async (defaultPassword: string = 'TempPassword123!'): Promise<LinkingResult> => {
  const result: LinkingResult = {
    totalPatients: 0,
    linkedPatients: 0,
    unlinkedPatients: 0,
    errors: []
  };

  try {
    // Get all patients that don't have a userId and have an email
    const patients = await (Patient as any).find({ 
      userId: { $exists: false },
      email: { $exists: true, $ne: null, $and: [{ $ne: '' }] }
    });

    result.totalPatients = patients.length;
    console.log(`Found ${patients.length} patients without linked user accounts`);

    for (const patient of patients) {
      try {
        if (!patient.email) continue;

        // Check if user already exists
        const existingUser = await User.findOne({ email: patient.email.toLowerCase() });
        if (existingUser) {
          // Link to existing user
          patient.userId = existingUser._id;
          await patient.save();
          result.linkedPatients++;
          console.log(`Linked patient ${patient.firstName} ${patient.lastName} to existing user ${existingUser.email}`);
          continue;
        }

        // Create new user account
        const newUser = new User({
          firstName: patient.firstName,
          lastName: patient.lastName,
          email: patient.email.toLowerCase(),
          password: defaultPassword,
          role: 'patient',
          phone: patient.phone,
          dateOfBirth: patient.dateOfBirth,
          gender: patient.gender,
          address: patient.address,
          isActive: true
        });

        await newUser.save();

        // Link patient to new user
        patient.userId = newUser._id;
        await patient.save();
        
        result.linkedPatients++;
        console.log(`Created user and linked patient ${patient.firstName} ${patient.lastName} (${patient.email})`);
      } catch (error) {
        const errorMsg = `Error creating user for patient ${patient._id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    console.log('\nUser Creation Summary:');
    console.log(`Total patients processed: ${result.totalPatients}`);
    console.log(`Successfully linked: ${result.linkedPatients}`);
    console.log(`Errors: ${result.errors.length}`);

    return result;
  } catch (error) {
    const errorMsg = `Fatal error during user creation process: ${error instanceof Error ? error.message : 'Unknown error'}`;
    result.errors.push(errorMsg);
    console.error(errorMsg);
    return result;
  }
};