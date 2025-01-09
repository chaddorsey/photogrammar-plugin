import { Option } from '../Search.d';
import { ReactNode } from 'react';

export interface Props {
  label: string;
  defaultValue?: Option | null;
  onChange: (value: Option | null, actionMeta?: { action: string }) => void;
  formatOptionLabel?: (option: Option) => ReactNode;
  fetchPath?: string;
  allOptions?: Option[];
  altFilterFunction?: (rows: any[]) => (option: Option) => boolean;
  isDisabled?: boolean;
  options?: Option[];
}
