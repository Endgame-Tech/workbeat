import { useContext } from 'react';
import { OfflineContext } from './OfflineContext';
import type { OfflineContextType } from './OfflineContext';

export function useOffline(): OfflineContextType {
  return useContext(OfflineContext);
}
