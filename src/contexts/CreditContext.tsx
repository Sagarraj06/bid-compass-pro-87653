import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DAILY_CREDITS } from '@/utils/constants';
import type { CreditState } from '@/types/credit.types';

interface CreditContextType {
  credits: CreditState;
  deductCredit: () => Promise<void>;
  resetCredits: () => void;
  loading: boolean;
}

const CreditContext = createContext<CreditContextType | undefined>(undefined);

const getNextMidnight = (): Date => {
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  return midnight;
};

export const CreditProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [credits, setCredits] = useState<CreditState>({
    total: DAILY_CREDITS,
    used: 0,
    remaining: DAILY_CREDITS,
    resetAt: getNextMidnight()
  });
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch credits from database
  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setLoading(false);
          return;
        }

        setUserId(user.id);

        // Call the database function to check and reset credits
        const { data, error } = await supabase.rpc('check_and_reset_credits', {
          p_user_id: user.id
        });

        if (error) throw error;

        if (data && data.length > 0) {
          const creditData = data[0];
          setCredits({
            total: creditData.total_credits,
            used: creditData.used_credits,
            remaining: creditData.remaining_credits,
            resetAt: new Date(creditData.last_reset_at)
          });
        }
      } catch (error) {
        console.error('Error fetching credits:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();

    // Check every minute if we need to refresh
    const interval = setInterval(fetchCredits, 60000);
    return () => clearInterval(interval);
  }, []);

  const deductCredit = async () => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    if (credits.remaining <= 0) {
      throw new Error('No credits remaining');
    }

    try {
      const { data, error } = await supabase.rpc('deduct_credit', {
        p_user_id: userId
      });

      if (error) throw error;

      if (!data) {
        throw new Error('Failed to deduct credit');
      }

      // Optimistically update UI
      setCredits(prev => ({
        ...prev,
        used: prev.used + 1,
        remaining: prev.remaining - 1
      }));
    } catch (error) {
      console.error('Error deducting credit:', error);
      throw error;
    }
  };

  const resetCredits = async () => {
    if (!userId) return;

    try {
      // Fetch fresh credits from database
      const { data, error } = await supabase.rpc('check_and_reset_credits', {
        p_user_id: userId
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const creditData = data[0];
        setCredits({
          total: creditData.total_credits,
          used: creditData.used_credits,
          remaining: creditData.remaining_credits,
          resetAt: new Date(creditData.last_reset_at)
        });
      }
    } catch (error) {
      console.error('Error resetting credits:', error);
    }
  };

  return (
    <CreditContext.Provider value={{ credits, deductCredit, resetCredits, loading }}>
      {children}
    </CreditContext.Provider>
  );
};

export const useCredits = (): CreditContextType => {
  const context = useContext(CreditContext);
  if (!context) {
    throw new Error('useCredits must be used within CreditProvider');
  }
  return context;
};
