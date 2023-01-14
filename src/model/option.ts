export interface SelectOptionsItem {
  value: string;
  label: string;
}

export interface SelectOptions {
  isLoading: boolean;
  items: SelectOptionsItem[];
}
