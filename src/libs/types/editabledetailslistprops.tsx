import { ConstrainMode } from "office-ui-fabric-react/lib/components/DetailsList";
import { IDetailsListProps } from "office-ui-fabric-react/lib/components/DetailsList/DetailsList";
import { IColumnConfig } from "./columnconfigtype";
import { IRowAddWithValues } from "./rowaddtype";

export interface Props extends IDetailsListProps {
    id: number;
    items: any[];
    columns: IColumnConfig[];
    enableSave?: boolean;
    enableRowEdit?: boolean;
    enableRowEditCancel?: boolean;
    enableColumnEdit?: boolean;
    enableBulkEdit?: boolean;
    enableCellEdit?: boolean;
    onGridSelectionChange?: any;
    onGridUpdate?:any;
    onGridSave?:any
    enableGridRowsDelete? : boolean;
    enableGridRowsAdd?: boolean;
    enableGridRowsSort?: boolean;
    enableRowAddWithValues?: IRowAddWithValues;
    enableTextFieldEditMode?: boolean;
    enableTextFieldEditModeCancel?: boolean;
    enablePagination?: boolean;
    pageSize?: number;
    height?: string;
    width? : string;
    position?: string;
    constrainMode?:ConstrainMode;
    enableUnsavedEditIndicator?: boolean;
    enableGridReset?: boolean;
    enableColumnFilterRules?: boolean;
    enableColumnFilters?: boolean;
    enableCommandBar?: boolean;
    enableSingleClickCellEdit?: boolean;
    undeleteableKeys?: string[];
}