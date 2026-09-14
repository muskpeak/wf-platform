import { ReactNode } from "react";

export interface Column<T> {
  key: string | number;
  header: ReactNode;
  render: (record: T, index: number) => ReactNode;
  
  // Responsive controls
  showOnDesktop?: boolean; // Default true
  showOnMobile?: boolean; // Default true
  mobilePrimary?: boolean; // If true, might render differently on mobile (e.g., as the card title)
  mobileOrder?: number; // Optional ordering on mobile
  
  // Optional styles
  className?: string; // Applied to desktop td / mobile value
  headerClassName?: string; // Applied to desktop th
}

export interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  rowKey: keyof T | ((record: T, index: number) => string | number);
  
  /**
   * Whether the table is currently loading
   */
  loading?: boolean;

  /**
   * Custom UI for the loading state (e.g. ResponsiveTableSkeleton).
   * If provided, will be rendered when loading is true.
   */
  loadingState?: React.ReactNode;

  /**
   * Custom UI for empty state (e.g. Empty component).
   * Overrides emptyText if provided.
   */
  emptyState?: React.ReactNode;

  /**
   * Whether the table is currently in an error state
   */
  error?: boolean;

  /**
   * Custom UI for the error state.
   */
  errorState?: React.ReactNode;

  /**
   * Text to show when there is no data and emptyState is not provided
   */
  emptyText?: React.ReactNode;

  className?: string; // Outer wrapper class
  rowClassName?: (record: T, index: number) => string; // Apply classes to row/card
}
