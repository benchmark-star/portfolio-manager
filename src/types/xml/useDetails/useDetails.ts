import { IAudit } from '../common/audit.js';
import { UseAttributeBase } from '../propertyUse/characteristicType.js';

export interface ITotalGrossFloorArea extends UseAttributeBase {
  value: number;
  '@_units': string;
}

export interface IUseDetails {
  totalGrossFloorArea: ITotalGrossFloorArea;
}

export interface IPropertyUse {
  useDetails: IUseDetails;
  audit?: IAudit;
}
