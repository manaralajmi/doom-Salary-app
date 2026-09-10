import { useState, useEffect, useCallback } from 'react';

export interface Commitment {
  id: string;
  name: string;
  amount: string;
}

export function useSalaryData() {
  const [salary, setSalary] = useState<string>('');
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [isCalculated, setIsCalculated] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedSalary = localStorage.getItem('doom_salary');
    const savedCommitments = localStorage.getItem('doom_commitments');
    
    if (savedSalary) {
      setSalary(savedSalary);
    }
    
    if (savedCommitments) {
      try {
        const parsed = JSON.parse(savedCommitments);
        if (Array.isArray(parsed)) {
          setCommitments(parsed);
        }
      } catch (e) {
        console.error('Failed to parse saved commitments', e);
      }
    }
    
    setIsReady(true);
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (!isReady) return;
    
    localStorage.setItem('doom_salary', salary);
    localStorage.setItem('doom_commitments', JSON.stringify(commitments));
    setIsCalculated(false); // Reset calculation when inputs change
  }, [salary, commitments, isReady]);

  const addCommitment = useCallback(() => {
    setCommitments(prev => [
      ...prev,
      { id: crypto.randomUUID(), name: '', amount: '' }
    ]);
  }, []);

  const updateCommitment = useCallback((id: string, field: keyof Commitment, value: string) => {
    setCommitments(prev => 
      prev.map(c => c.id === id ? { ...c, [field]: value } : c)
    );
  }, []);

  const removeCommitment = useCallback((id: string) => {
    setCommitments(prev => prev.filter(c => c.id !== id));
  }, []);

  const calculate = useCallback(() => {
    setIsCalculated(true);
  }, []);

  const resetCalculation = useCallback(() => {
    setIsCalculated(false);
  }, []);

  return {
    salary,
    setSalary,
    commitments,
    addCommitment,
    updateCommitment,
    removeCommitment,
    isCalculated,
    calculate,
    resetCalculation,
    isReady
  };
}

export function formatKWD(amount: number): string {
  // Fix weird NaN issues and format cleanly
  if (isNaN(amount) || !isFinite(amount)) amount = 0;
  
  // Format string with exact 3 decimal places as standard in Kuwait
  const parts = amount.toFixed(3).split('.');
  // Add commas to thousands
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return `${parts.join('.')} د.ك`;
}

export function parseNumber(value: string): number {
  if (!value || value.trim() === '') return 0;
  const num = parseFloat(value.replace(/,/g, ''));
  return isNaN(num) ? 0 : num;
}
