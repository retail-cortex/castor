import { useState, useEffect, useCallback } from 'react';
import { SkillItem } from '../types/skill';
import { SkillService } from '../services/skillService';

export const useSkillDetail = (skillIdOrName?: string) => {
  const [skill, setSkill] = useState<SkillItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!skillIdOrName) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await SkillService.getSkill(skillIdOrName);
      setSkill(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [skillIdOrName]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return {
    skill,
    isLoading,
    error,
    reload: fetchDetail,
  };
};
