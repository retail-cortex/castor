import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SkillItem, SkillPagination } from '../types/skill';
import { HitlTier } from '../types/security';
import { SkillService } from '../services/skillService';
import { useAuth } from './AuthContext';
import { useWorkspace } from './WorkspaceContext';

interface SkillCatalogContextValue {
  skills: SkillItem[];
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (cat: string | null) => void;
  selectedTier: HitlTier | null;
  setSelectedTier: (tier: HitlTier | null) => void;
  selectedScope: 'all' | 'team' | 'personal';
  setSelectedScope: (scope: 'all' | 'team' | 'personal') => void;
  pagination: SkillPagination;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  refreshSkills: () => Promise<void>;
}

const SkillCatalogContext = createContext<SkillCatalogContextValue | null>(null);

export const SkillCatalogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { activeApp } = useWorkspace();

  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<HitlTier | null>(null);
  const [selectedScope, setSelectedScope] = useState<'all' | 'team' | 'personal'>('all');
  const [pagination, setPagination] = useState<SkillPagination>({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 1,
  });

  const fetchSkills = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await SkillService.listSkills({
        query: searchQuery || undefined,
        category: selectedCategory || undefined,
        page: pagination.page,
        pageSize: pagination.pageSize,
      });

      let filtered = res.skills;
      if (selectedTier) {
        filtered = filtered.filter((s) => s.hitlTier === selectedTier);
      }
      if (selectedScope === 'team') {
        filtered = filtered.filter((s) => s.appId === activeApp.appId);
      }

      setSkills(filtered);
      setPagination(res.pagination);
    } catch {
      // Handled
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedTier, selectedScope, pagination.page, pagination.pageSize, activeApp.appId]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSkills();
    }
  }, [isAuthenticated, fetchSkills]);

  const setPage = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const setPageSize = (pageSize: number) => {
    const clamped = Math.min(Math.max(pageSize, 1), 25);
    setPagination((prev) => ({ ...prev, pageSize: clamped, page: 1 }));
  };

  return (
    <SkillCatalogContext.Provider
      value={{
        skills,
        isLoading,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        selectedTier,
        setSelectedTier,
        selectedScope,
        setSelectedScope,
        pagination,
        setPage,
        setPageSize,
        refreshSkills: fetchSkills,
      }}
    >
      {children}
    </SkillCatalogContext.Provider>
  );
};

export const useSkillCatalog = (): SkillCatalogContextValue => {
  const ctx = useContext(SkillCatalogContext);
  if (!ctx) throw new Error('useSkillCatalog must be used within a SkillCatalogProvider');
  return ctx;
};
