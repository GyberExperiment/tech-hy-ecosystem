import { useAccount } from 'wagmi';
import { useMemo } from 'react';

// ✅ ADMIN ADDRESS - только этот адрес может видеть админ панель
const ADMIN_ADDRESS = "0xe70eC2DeA28CD14B2d392E72F2fE68F8d8799D5E";

export const useAdminAccess = () => {
  const { address, isConnected } = useAccount();

  const isAdmin = useMemo(() => {
    if (!isConnected || !address) return false;
    return address.toLowerCase() === ADMIN_ADDRESS.toLowerCase();
  }, [address, isConnected]);

  return {
    isAdmin,
    adminAddress: ADMIN_ADDRESS,
    currentAddress: address,
    isConnected
  };
}; 