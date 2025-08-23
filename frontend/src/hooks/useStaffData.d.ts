import { StaffMember } from '../types/staff';

declare module '../hooks/useStaffData' {
  interface UseStaffDataReturn {
    staff: StaffMember[];
    loading: boolean;
    error: Error | null;
    activeRole: string;
    setActiveRole: (role: string) => void;
    filteredStaff: StaffMember[];
    fetchStaff: () => Promise<void>;
    updateStaffMember: (id: number, updateData: Partial<StaffMember>) => Promise<StaffMember>;
    deleteStaff: (id: number) => Promise<void>;
    addStaff: (staffData: Omit<StaffMember, 'id'>) => Promise<any>;
    refresh: () => Promise<void>;
  }

  const useStaffData: () => UseStaffDataReturn;
  export default useStaffData;
}
