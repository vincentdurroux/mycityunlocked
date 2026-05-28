import { useState, useEffect } from 'react';
import { proService } from '../services/proService';
import { isSupabaseConfigured } from '../lib/supabase';

// We import MOCK_PROS directly or define it here
// To avoid circular dependency if MOCK_PROS is in App.tsx, we'll pass it as fallback or define it in a constants file
// For simplicity, let's assume we want a clean way to handle this.

export function useProfessionals(fallbackData: any[] = []) {
  const [professionals, setProfessionals] = useState<any[]>(fallbackData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  async function loadPros() {
    setLoading(true);
    try {
      if (!isSupabaseConfigured) {
        setProfessionals([]);
        setLoading(false);
        return;
      }

      const data = await proService.getProfessionals();
      setProfessionals(data || []);
    } catch (err) {
      console.error('Failed to load professionals from Supabase:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setProfessionals([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPros();
  }, []);

  return { professionals, loading, error, refetch: loadPros };
}
