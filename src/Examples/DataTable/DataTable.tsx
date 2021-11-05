// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { DetailsListLayoutMode, Fabric, mergeStyleSets, SelectionMode } from 'office-ui-fabric-react';
import * as React from 'react';
import { useState } from 'react';
import { EditableGrid, IColumnConfig, ICallBackParams } from '../../libs';

import InfoBar from '../../libs/infobar/InfoBar';


export interface ObsoleteDatatypObject {
    key: string;
    text: string;
  }
  
  export interface IDataTableRow {
    NameExtern: string;
    Beschreibung: string;
    Quelle: string;
    Datentyp: string | ObsoleteDatatypObject ;
    Gutschrift: string;
    DebitCreditCodeSource: string;
    Pflicht: string;
    // _grid_row_operation_?: Number
  }

interface IDataTableProps {
  title?: string;
  index: number;
  colums: IColumnConfig[];
  data: IDataTableRow[];
  onSaveData?: any;
  onContextMenu?: any;
  forbiddenValues?: string[];
  undeleteableKeys?: string[];
}

const DataTable = (props: IDataTableProps) => {
  const [items, setItems] = useState<IDataTableRow[]>([]);
  const [hideInfoBar, setHideInfoBar] = useState(true);
  const [infoBarMessage, setInfoBarMessage] = useState('');

  const classNames = mergeStyleSets({
    controlWrapper: {
      display: 'block',
      flexWrap: 'wrap',
    },
  });

  React.useEffect(() => {
    //tableRowList();
    var newItems: IDataTableRow[] = [];
    props.data.forEach((val) => {
      if (typeof val.Datentyp === 'object') val.Datentyp = val.Datentyp.key;
      newItems.push(val);
    });
    setItems(props.data);
  }, [props.data]);

  const onGridSave = (data: IDataTableRow[]): void => {
    setItems([...data]);
    if (props.onSaveData) {
      props.onSaveData([...data]);
    }
  };

  // INFO: Das im Folgenden sind callbacks die man implementieren KANN
  const onNameExternChanged = (callbackRequestParamObj: ICallBackParams): any[] => {
    let key = callbackRequestParamObj.triggerkey;
    const row = callbackRequestParamObj.data[0];
    const value = row[key];
    if (props.forbiddenValues && props?.forbiddenValues.includes(value)) {
      setInfoBarMessage('Bitte verwenden sie diesen Begriff nicht');
      setHideInfoBar(false);
      return [];
    }
    onGridSave(callbackRequestParamObj.data);
    return callbackRequestParamObj.data;
  };

  const onDescriptionChanged = (callbackRequestParamObj: ICallBackParams): any[] => {
    return callbackRequestParamObj.data;
  };

  // onDatatypeChanged
  const onDatatypeChanged = (callbackRequestParamObj: ICallBackParams): any[] => {
    return callbackRequestParamObj.data;
  };

  const onSourceChanged = (callbackRequestParamObj: ICallBackParams): any[] => {
    return callbackRequestParamObj.data;
  };

  const onCreditChanged = (callbackRequestParamObj: ICallBackParams): any[] => {
    return callbackRequestParamObj.data;
  };

  const onShallHaveChanged = (callbackRequestParamObj: ICallBackParams): any[] => {
    return callbackRequestParamObj.data;
  };

  const attachGridValueChangeCallbacks = (columnConfig: IColumnConfig[]): IColumnConfig[] => {
    // INFO: hier können events angehangen werden, die ausgelöst werden wenn sich eine einzelne Zelle ändert. In dem Event könnte
    // man die Save funktion auslösen.
    columnConfig.filter((item) => item.key === 'NameExtern').map((item) => (item.onChange = onNameExternChanged));
    columnConfig.filter((item) => item.key === 'Beschreibung').map((item) => (item.onChange = onDescriptionChanged));
    columnConfig.filter((item) => item.key === 'Datentyp').map((item) => (item.onChange = onDatatypeChanged));
    columnConfig.filter((item) => item.key === 'Quelle').map((item) => (item.onChange = onSourceChanged));
    columnConfig.filter((item) => item.key === 'Gutschrift').map((item) => (item.onChange = onCreditChanged));
    columnConfig.filter((item) => item.key === 'DebitCreditCodeSource').map((item) => (item.onChange = onShallHaveChanged));

    return columnConfig;
  };

  return (
    <Fabric>
      <div className={classNames.controlWrapper}>
        {/* <TextField placeholder='Search Grid' className={mergeStyles({ width: '60vh', paddingBottom:'10px' })} onChange={(event) => EventEmitter.dispatch(EventType.onSearch, event)}/> */}
        <h5>{props.title ? props.title : 'Data Table'}</h5>
        <InfoBar message={infoBarMessage} type="error" hidden={hideInfoBar}></InfoBar>
      </div>
      <EditableGrid
        id={props.index}
        enableColumnEdit={false}
        enableSave={true}
        columns={
          attachGridValueChangeCallbacks(
            JSON.parse(JSON.stringify(props.colums))
          ) /* Damit bekommt jede Instanz des Table seine eigene Column-Liste. Sonst gibts Abhängigkeiten bei den Events. */
        }
        layoutMode={DetailsListLayoutMode.justified}
        selectionMode={SelectionMode.single}
        enableRowEdit={false}
        enableRowEditCancel={true}
        enableBulkEdit={false}
        items={items}
        undeleteableKeys={props.undeleteableKeys}
        enableCellEdit={true}
        enableTextFieldEditMode={true}
        enableTextFieldEditModeCancel={true}
        enableGridRowsDelete={true}
        enableGridRowsAdd={true}
        height={'50vh'}
        width={'150vh'}
        position={'relative'}
        enableUnsavedEditIndicator={true}
        onGridSave={onGridSave}
        enableGridReset={false}
        enableColumnFilters={true}
        enableColumnFilterRules={true}
        enableRowAddWithValues={{ enable: false, enableRowsCounterInPanel: true }}
        onItemContextMenu={(_0, _1, e) => props?.onContextMenu(e, false)}
        compact={true}
      />
    </Fabric>
  );
};

export default DataTable;
