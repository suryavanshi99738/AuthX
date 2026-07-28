/**
 * Common Type Definitions
 *
 * Shared utility types used throughout the BankShield Auth application.
 */

/**
 * Makes all properties of T nullable (can be null)
 */
export type Nullable<T> = T | null;

/**
 * Makes all properties of T optional (can be undefined)
 */
export type Optional<T> = T | undefined;

/**
 * Makes all properties of T recursively optional
 * Useful for partial update operations
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Generic record type for key-value pairs
 */
export interface RecordType {
  [key: string]: unknown;
}

/**
 * Key-value pair type
 */
export interface KeyValue<T = string> {
  key: string;
  value: T;
}

/**
 * ID type alias for consistent identifier usage
 */
export type ID = string;

/**
 * Timestamp type for date strings
 */
export type Timestamp = string;

/**
 * Email type for email validation
 */
export type Email = string;

/**
 * Phone number type
 */
export type PhoneNumber = string;

/**
 * Sort direction type
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Status type for async operations
 */
export type AsyncStatus = 'error' | 'idle' | 'loading' | 'success';

/**
 * Generic async state interface
 */
export interface AsyncState<T> {
  data: Nullable<T>;
  status: AsyncStatus;
  error: Nullable<string>;
}

/**
 * Generic select option type
 */
export interface SelectOption<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
}

/**
 * Generic filter type
 */
export interface Filter<T = string> {
  field: string;
  operator: 'contains' | 'endsWith' | 'equals' | 'in' | 'startsWith';
  value: T;
}

/**
 * Time range type for date filtering
 */
export interface TimeRange {
  start: Date;
  end: Date;
}

/**
 * Result type for operations that can fail
 */
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };
