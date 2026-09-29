import React from 'react';
import { Icon } from '../common/Icon';
import { SkillPagination } from '../../types/skill';

interface PaginationBarProps {
  pagination: SkillPagination;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export const PaginationBar: React.FC<PaginationBarProps> = ({
  pagination,
  onPageChange,
  onPageSizeChange,
}) => {
  const { page, pageSize, totalCount, totalPages } = pagination;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-4 glass-panel rounded-xl text-xs border border-outline-variant/30">
      <div className="flex items-center gap-3">
        <span className="text-outline">
          Showing <span className="font-mono text-on-surface font-semibold">{totalCount > 0 ? (page - 1) * pageSize + 1 : 0}</span> to{' '}
          <span className="font-mono text-on-surface font-semibold">{Math.min(page * pageSize, totalCount)}</span> of{' '}
          <span className="font-mono text-primary font-semibold">{totalCount}</span> skills
        </span>

        <div className="flex items-center gap-1.5 ml-2">
          <span className="text-outline text-[11px]">Per Page:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(parseInt(e.target.value, 10))}
            className="bg-surface-container/60 border border-outline-variant/40 rounded px-2 py-1 text-xs text-on-surface font-mono"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={25}>25 (Max)</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="px-3 py-1.5 rounded-lg border border-outline-variant/40 hover:bg-white/[0.05] disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 text-on-surface transition-colors"
        >
          <Icon name="arrow_back" size={16} />
          <span>Previous</span>
        </button>

        <span className="font-mono text-xs px-2 text-on-surface">
          Page {page} of {Math.max(totalPages, 1)}
        </span>

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="px-3 py-1.5 rounded-lg border border-outline-variant/40 hover:bg-white/[0.05] disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 text-on-surface transition-colors"
        >
          <span>Next</span>
          <Icon name="arrow_forward" size={16} />
        </button>
      </div>
    </div>
  );
};
