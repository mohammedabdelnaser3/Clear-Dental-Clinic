import { useState, useMemo } from 'react';
import { DEFAULT_PAGE_SIZE } from '../config/constants';

interface UsePaginationProps {
  totalItems: number;
  initialPage?: number;
  initialPageSize?: number;
  siblingsCount?: number;
}

interface UsePaginationReturn {
  page: number;
  pageSize: number;
  totalPages: number;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  canPreviousPage: boolean;
  canNextPage: boolean;
  previousPage: () => void;
  nextPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  pageItems: number[];
  startIndex: number;
  endIndex: number;
}

/**
 * Custom hook for handling pagination
 * @param props Pagination props
 * @returns Pagination state and functions
 */
export const usePagination = ({
  totalItems,
  initialPage = 1,
  initialPageSize = DEFAULT_PAGE_SIZE,
  siblingsCount = 1,
}: UsePaginationProps): UsePaginationReturn => {
  const [page, setPage] = useState<number>(initialPage);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalItems / pageSize));
  }, [totalItems, pageSize]);

  // Ensure page is within valid range
  useMemo(() => {
    if (page > totalPages) {
      setPage(totalPages);
    } else if (page < 1) {
      setPage(1);
    }
  }, [page, totalPages]);

  const canPreviousPage = page > 1;
  const canNextPage = page < totalPages;

  const previousPage = () => {
    if (canPreviousPage) {
      setPage(page - 1);
    }
  };

  const nextPage = () => {
    if (canNextPage) {
      setPage(page + 1);
    }
  };

  const firstPage = () => {
    setPage(1);
  };

  const lastPage = () => {
    setPage(totalPages);
  };

  // Calculate page items to display (with ellipsis)
  const pageItems = useMemo(() => {
    const range = (start: number, end: number) => {
      const length = end - start + 1;
      return Array.from({ length }, (_, i) => start + i);
    };

    const totalPageNumbers = siblingsCount * 2 + 5; // siblings + first + last + current + 2 ellipsis

    // If total pages is less than the page numbers we want to show
    if (totalPageNumbers >= totalPages) {
      return range(1, totalPages);
    }

    const leftSiblingIndex = Math.max(page - siblingsCount, 1);
    const rightSiblingIndex = Math.min(page + siblingsCount, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

    const firstPageIndex = 1;
    const lastPageIndex = totalPages;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingsCount;
      const leftRange = range(1, leftItemCount);
      return [...leftRange, -1, totalPages];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingsCount;
      const rightRange = range(totalPages - rightItemCount + 1, totalPages);
      return [firstPageIndex, -1, ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = range(leftSiblingIndex, rightSiblingIndex);
      return [firstPageIndex, -1, ...middleRange, -1, lastPageIndex];
    }

    return [];
  }, [page, totalPages, siblingsCount]);

  // Calculate start and end indices for current page
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize - 1, totalItems - 1);

  return {
    page,
    pageSize,
    totalPages,
    setPage,
    setPageSize,
    canPreviousPage,
    canNextPage,
    previousPage,
    nextPage,
    firstPage,
    lastPage,
    pageItems,
    startIndex,
    endIndex,
  };
};