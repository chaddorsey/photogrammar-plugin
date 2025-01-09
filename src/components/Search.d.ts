import { ActionMeta } from 'react-select';

export interface Option {
  label: string;
  value: string;
  sublabels?: string[];
}

export type Field = 'photographer_name' | 'state' | 'nhgis_join' | 'city' | 'themes' | 'count';

export interface Cities {
  [key: string]: Option[];
}

export interface DBCities {
  [key: string]: {
    cities: Cities;
    counties: Cities;
  };
}

export interface DBQueryResult {
  field: string;
}

export interface Props {
  selectedPhotographerOption: Option | null;
  selectedStateOption: Option | null;
  selectedThemeOption: Option | null;
  selectedCountyOption: Option | null;
  selectedCityOption: Option | null;
  selectedPhotoCaption: Option | null;
  terms: string[] | null;
  timeRange: [number, number];
  selectedMapView: string;
  countiesOrCitiesOptions: {
    cities: Cities;
    counties: Cities;
  };
  toggleSearch: () => void;
  open?: boolean;
}
