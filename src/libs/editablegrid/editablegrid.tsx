// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as React from 'react';
import { ConstrainMode, IColumn, IDetailsHeaderProps } from 'office-ui-fabric-react/lib/components/DetailsList/DetailsList.types';
import { useState, useEffect } from 'react';
import { DetailsList } from 'office-ui-fabric-react/lib/components/DetailsList/DetailsList';
import { CommandBar, ICommandBarItemProps } from 'office-ui-fabric-react/lib/CommandBar';
import { DetailsListLayoutMode, Selection, IDetailsColumnRenderTooltipProps } from 'office-ui-fabric-react/lib/DetailsList';
import {
  Panel,
  PanelType,
  Fabric,
  Dropdown,
  IDropdownOption,
  Dialog,
  DatePicker,
  Sticky,
  StickyPositionType,
  IRenderFunction,
  TooltipHost,
  mergeStyles,
  Spinner,
  SpinnerSize,
  TagPicker,
  ITag,
  IBasePickerSuggestionsProps,
  IInputProps,
  MarqueeSelection,
  ScrollablePane,
  ScrollbarVisibility,
} from 'office-ui-fabric-react';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { IColumnConfig } from '../types/columnconfigtype';
import { dropdownStyles, GetDynamicSpanStyles, textFieldStyles } from './editablegridstyles';
import { Operation } from '../types/operation';
import {
  InitializeInternalGrid,
  InitializeInternalGridEditStructure,
  ResetGridRowID,
  ShallowCopyDefaultGridToEditGrid,
} from './editablegridinitialize';
import { EditControlType } from '../types/editcontroltype';
import { dateToISOLikeButLocal, DayPickerStrings } from './datepickerconfig';
import { EditType } from '../types/edittype';
import MessageDialog from './messagedialog';
import ColumnUpdateDialog from './columnupdatedialog';
import EditPanel from './editpanel';
import { ICallBackParams } from '../types/callbackparams';
import { EventEmitter, EventType } from '../eventemitter/EventEmitter';
import ColumnFilterDialog from './columnfilterdialog/columnfilterdialog';
import { IFilter } from '../types/filterstype';
import { applyGridColumnFilter, filterGridData, isColumnDataTypeSupportedForFilter, IsValidDataType } from './helper';
import { IFilterItem, IFilterListProps, IGridColumnFilter } from '../types/columnfilterstype';
import FilterCallout from './columnfiltercallout/filtercallout';
import AddRowPanel from './addrowpanel';
import { Props } from '../types/editabledetailslistprops';
import PickerControl from './pickercontrol/picker';
import { Checkbox } from '@fluentui/react';
import { IMap } from './../types/options_type';

interface SortOptions {
  key: string;
  isAscending: boolean;
  isEnabled: boolean;
}

const EditableGrid = (props: Props) => {
  const [editMode, setEditMode] = React.useState(false);
  const [isOpenForEdit, setIsOpenForEdit] = React.useState(false);
  const dismissPanelForEdit = React.useCallback(() => setIsOpenForEdit(false), []);
  const [isOpenForAdd, setIsOpenForAdd] = React.useState(false);
  const dismissPanelForAdd = React.useCallback(() => setIsOpenForAdd(false), []);
  const [, setGridData] = useState<any[]>([]);
  const [defaultGridData, setDefaultGridData] = useState<any[]>([]);
  const [, /*backupDefaultGridData*/ setBackupDefaultGridData] = useState<any[]>([]);
  const [activateCellEdit, setActivateCellEdit] = useState<any[]>([]);
  const [, setSelectionDetails] = useState('');
  const [selectedItems, setSelectedItems] = useState<any[]>();
  const [, setCancellableRows] = useState<any[]>([]);
  const [, setSelectionCount] = useState(0);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [isGridInEdit, setIsGridInEdit] = React.useState(false);
  const [dialogContent, setDialogContent] = React.useState<JSX.Element | undefined>(undefined);
  const [isUpdateColumnClicked, setIsUpdateColumnClicked] = React.useState(false);
  const [isColumnFilterClicked, setIsColumnFilterClicked] = React.useState(false);
  const [showSpinner] = useState(false);
  const [isGridStateEdited, setIsGridStateEdited] = useState(false);
  const [defaultTag, setDefaultTag] = useState<ITag[]>([]);
  const [filteredColumns, setFilteredColumns] = useState<IColumnConfig[]>([]);
  const gridColumnFilterArrRef: any = React.useRef<IGridColumnFilter[]>([]);
  const [filterCalloutComponent, setFilterCalloutComponent] = React.useState<JSX.Element | undefined>(undefined);
  const [showFilterCallout, setShowFilterCallout] = React.useState(false);
  const [messageDialogProps, setMessageDialogProps] = React.useState({
    visible: false,
    message: '',
    subMessage: '',
  });
  const [sortColObj, setSortColObj] = React.useState<SortOptions>({ key: '', isAscending: false, isEnabled: false });
  let filterStoreRef: any = React.useRef<IFilter[]>([]);

  const [undeletableRowSelected, setUndeletableRowSelected] = React.useState(false);

  const [_selection, _] = useState(
    new Selection({
      onSelectionChanged: () => {
        setSelectionDetails(_getSelectionDetails());

        var selDetails = _selection.getSelection();
        if (selDetails.length > 0) {
          var res = false;
          selDetails.forEach((item) => {
            res = res || (props.undeleteableKeys || []).indexOf((item as any)['NameExtern']) >= 0;
          });
          setUndeletableRowSelected(res);
        }
      },
    })
  );

  const sortGrid = (): any[] => {
    var sortedGrid: any[] = [];
    if (defaultGridData.indexOf(props.undeleteableKeys) !== -1) {
      sortedGrid.push(defaultGridData.indexOf(props.undeleteableKeys));
      sortedGrid.push(defaultGridData.slice(defaultGridData.indexOf(props.undeleteableKeys)));
      setDefaultGridData(sortGrid);
    }
    return defaultGridData;
  };

  const onSearchHandler = (event: any) => {
    var gridDataTmp: any[];
    if (event && event.target) {
      let queryText = event.target.value;
      if (queryText) {
        let searchableColumns = props.columns.filter((x) => x.includeColumnInSearch === true).map((x) => x.key);

        let searchResult: any[] = [...defaultGridData];
        searchResult.filter((_gridData) => {
          var BreakException = {};
          try {
            searchableColumns.forEach((item2) => {
              if (
                _gridData[item2] &&
                _gridData[item2].toString().toLowerCase() &&
                _gridData[item2].toString().toLowerCase().includes(queryText.trim().toLowerCase())
              ) {
                _gridData._is_filtered_in_grid_search_ = true;
                throw BreakException;
              } else {
                _gridData._is_filtered_in_grid_search_ = false;
              }
            });
          } catch (e) {
            // if (e !== BreakException) throw e;
          }
          return BreakException;
        });

        setDefaultGridData(searchResult);
      } else {
        gridDataTmp = [...defaultGridData];
        gridDataTmp.map((item) => (item._is_filtered_in_grid_search_ = true));
        setDefaultGridData(gridDataTmp);
      }
    } else {
      gridDataTmp = [...defaultGridData];
      gridDataTmp.map((item) => (item._is_filtered_in_grid_search_ = true));
      setDefaultGridData(gridDataTmp);
    }
  };

  // Custom - Ole & Alex
  React.useEffect(() => {
    sortGrid();
    ShowGridEditMode();
  }, [defaultGridData]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    EventEmitter.subscribe(EventType.onSearch, onSearchHandler);
    return function cleanup() {
      EventEmitter.unsubscribe(EventType.onSearch, onSearchHandler);
    };
  });

  useEffect(() => {
    if ((!defaultGridData || defaultGridData.length === 0) && props && props.items && props.items.length > 0) {
      var data: any[] = InitializeInternalGrid(props.items);
      setGridData(data);
      setBackupDefaultGridData(data.map((obj) => ({ ...obj })));
      setGridEditState(false);
      SetGridItems(data);
    }
    // }else if(props && props.items && props.items.length > 0) {
    //   var data: any[] = InitializeInternalGrid(props.items);
    //   setGridData(data);
    //   SetGridItems(data);
    //   saveData();
    //   // props.onGridSave(data);
    //   // setDefaultGridData(data);
    //   // onGridSave();
    // }
  }, [props.items]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    UpdateGridEditStatus();
  }, [activateCellEdit]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {}, [isGridInEdit]);

  useEffect(() => {
    SetFilteredGridData(getFilterStoreRef());
  }, [filteredColumns]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (filterCalloutComponent) {
      setShowFilterCallout(true);
    }
  }, [filterCalloutComponent]);

  const onGridSave = (data?: any[] | undefined): void => {
    if (props.onGridSave) {
      if (!data || data === null) {
        props.onGridSave(defaultGridData);
      } else if (data && data.length > 0) {
        props.onGridSave(data);
      }
    }
  };

  const onGridSaveAfterDelete = (data: any[]) => {
    if (props.onGridSave) {
      props.onGridSave(data);
    }
  };

  const UpdateGridEditStatus = (): void => {
    var gridEditStatus: boolean = false;
    var BreakException = {};

    try {
      activateCellEdit.forEach((item, index) => {
        gridEditStatus = gridEditStatus || item.isActivated;
        if (gridEditStatus) {
          throw BreakException;
        }

        var objectKeys = Object.keys(item.properties);
        objectKeys
          .filter((key) => key !== '_grid_row_id_' && key !== '_grid_row_operation_')
          .forEach((objKey) => {
            gridEditStatus = gridEditStatus || item['properties'][objKey]['activated'];
            if (gridEditStatus) {
              throw BreakException;
            }
          });
      });
    } catch (e) {
      // if (e !== BreakException) throw e;
    }

    if ((!isGridInEdit && gridEditStatus) || (isGridInEdit && !gridEditStatus)) {
      setIsGridInEdit(gridEditStatus);
    }
  };

  const SetGridItems = (data: any[]): void => {
    data = ResetGridRowID(data);
    setDefaultGridData(data);
    setActivateCellEdit(InitializeInternalGridEditStructure(data));
  };

  const setGridEditState = (editState: boolean): void => {
    if (isGridStateEdited !== editState) {
      setIsGridStateEdited(editState);
    }
  };

  const SetFilteredGridData = (filters: IFilter[]): void => {
    var filteredData = filterGridData(defaultGridData, filters);
    var activateCellEditTmp = ShallowCopyDefaultGridToEditGrid(defaultGridData, activateCellEdit);
    setDefaultGridData(filteredData);
    setActivateCellEdit(activateCellEditTmp);
    setGridData(filteredData);
  };

  /* #region [Grid Bulk Update Functions] */
  const onEditPanelChange = (item: any): void => {
    var defaultGridDataTmp = UpdateBulkData(item, defaultGridData);
    dismissPanelForEdit();

    defaultGridDataTmp = CheckBulkUpdateOnChangeCallBack(item, defaultGridDataTmp);

    SetGridItems(defaultGridDataTmp);
  };
  /* #endregion */

  /* #region [Grid Column Update Functions] */
  const UpdateBulkData = (data: any, defaultGridDataArr: any[]): any[] => {
    let newDefaultGridData = [...defaultGridDataArr];

    selectedItems!.forEach((item, index) => {
      newDefaultGridData
        .filter((x) => x._grid_row_id_ === item._grid_row_id_)
        .map((row) => {
          var objectKeys = Object.keys(data);
          objectKeys.forEach((objKey) => {
            row[objKey] = data[objKey];
            if (row._grid_row_operation_ !== Operation.Add) {
              row._grid_row_operation_ = Operation.Update;
            }
          });

          return row;
        });
    });

    setGridEditState(true);
    return newDefaultGridData;
  };

  const CheckBulkUpdateOnChangeCallBack = (data: any, defaultGridDataTmp: any[]): any[] => {
    var columns: IColumnConfig[] = [];
    data.forEach(function (key: any) {
      var column = props.columns.filter((item) => item.key === key)[0];
      if (column.onChange) {
        columns.push(column);
      }
    });
    columns.forEach((column) => {
      defaultGridDataTmp = CheckCellOnChangeCallBack(
        defaultGridDataTmp,
        selectedItems!.map((item) => item._grid_row_id_),
        column
      );
    });

    return defaultGridDataTmp;
  };

  const UpdateGridColumnData = (data: any): void => {
    var defaultGridDataTmp = UpdateBulkData(data, defaultGridData);

    CloseColumnUpdateDialog();

    defaultGridDataTmp = CheckBulkUpdateOnChangeCallBack(data, defaultGridDataTmp);
    SetGridItems(defaultGridDataTmp);
  };

  const CloseColumnUpdateDialog = (): void => {
    setIsUpdateColumnClicked(false);
  };
  /* #endregion */

  /* #region [Grid Row Add Functions] */
  const CloseRenameDialog = React.useCallback((): void => {
    setDialogContent(undefined);
  }, []);

  const GetDefaultRowObject = (rowCount: number): any[] => {
    let exisitingRowObj: any = {};
    let addedRows: any[] = [];
    let _new_grid_row_id_ = Math.max.apply(
      Math,
      defaultGridData.map(function (o) {
        return o._grid_row_id_;
      })
    );

    if (defaultGridData && defaultGridData.length > 0) {
      exisitingRowObj = defaultGridData[0];
    } else {
      props.columns.forEach((item, index) => {
        exisitingRowObj[item.key] = '';
        // TODO: Dynmaisch aus der Column config
        exisitingRowObj['Gutschrift'] = '';
      });
    }

    var objectKeys = Object.keys(exisitingRowObj);

    for (var i = 1; i <= rowCount; i++) {
      let obj: any = {};
      objectKeys.forEach((item) => {
        //obj[item] = 'NEW';
        obj[item] = '';
      });

      obj._grid_row_id_ = ++_new_grid_row_id_;
      obj._grid_row_operation_ = Operation.Add;
      obj._is_filtered_in_ = true;
      obj._is_filtered_in_grid_search_ = true;
      obj._is_filtered_in_column_filter_ = true;
      obj.Options = {} as IMap<any>;

      addedRows.push(obj);
    }

    return addedRows;
  };

  const AddRowsToGrid = (): void => {
    var addedRows = GetDefaultRowObject(1);
    var newGridData = [...defaultGridData, ...addedRows];
    setGridEditState(true);
    SetGridItems(newGridData);
  };

  const onAddPanelChange = (item: any, noOfRows: number): void => {
    dismissPanelForAdd();
    if (noOfRows < 1) {
      return;
    }

    var addedRows = GetDefaultRowObject(noOfRows);
    if (Object.keys(item).length > 0) {
      addedRows.map((row) => {
        var objectKeys = Object.keys(item);
        objectKeys.forEach((key) => {
          row[key] = item[key];
        });

        return row;
      });
    }

    var newGridData = [...defaultGridData];
    addedRows.forEach((row, index) => newGridData.splice(index, 0, row));
    setGridEditState(true);
    SetGridItems(newGridData);
  };
  /* #endregion */

  function move(input: any[], from: number, to: number) {
    if (from < 0 || to < 0) {
      return;
    }

    let numberOfDeletedElm = 1;

    const elm = input.splice(from, numberOfDeletedElm)[0];

    numberOfDeletedElm = 0;

    input.splice(to, numberOfDeletedElm, elm);
  }

  const MoveRow = (v: number): void => {
    if (selectedItems!.length > 1) {
      ShowMessageDialog('Verschieben', 'Das Verschieben mehrere Zeilen wird derzeit nicht unterstützt.');
      return;
    }

    let data = [...defaultGridData];
    let items: any[] | undefined = [...selectedItems!];

    items!.forEach((item, _) => {
      let oldIndex = data.indexOf(item);
      let newIndex = oldIndex + v;
      move(data, oldIndex, newIndex);
      _selection.setIndexSelected(oldIndex, false, true);
      _selection.setIndexSelected(newIndex, true, true);
    });

    // Hier müssen wir nochmal die selectedItems setzen, da sich diese irgendwie wieder verändern.
    // Nach dem Verschieben ist dann immer das nun darübere Item in der Selection.
    setSelectedItems(selectedItems);

    setGridEditState(true);
    SetGridItems(data);

    setBackupDefaultGridData(data);
    setGridData(data);
    setDefaultGridData(data);
    onGridSave(data);
  };

  /* #region [Grid Row Delete Functions] */
  const ShowMessageDialog = (message: string, subMessage: string): void => {
    setMessageDialogProps({
      visible: true,
      message: message,
      subMessage: subMessage,
    });
  };

  const CloseMessageDialog = (): void => {
    setMessageDialogProps({
      visible: false,
      message: '',
      subMessage: '',
    });
  };

  const DeleteSelectedRows = (): void => {
    let defaultGridDataTmp = [...defaultGridData];

    selectedItems!.forEach((item, index) => {
      defaultGridDataTmp.filter((x) => x._grid_row_id_ === item._grid_row_id_).map((x) => (x._grid_row_operation_ = Operation.Delete));
    });

    let newGridData = defaultGridData.filter((x) => x._grid_row_operation_ !== Operation.Delete);

    setGridEditState(true);
    SetGridItems(newGridData);

    // hier gibts es eigentlich keinen State sondern nur setter
    setBackupDefaultGridData(newGridData);
    setGridData(newGridData);
    setDefaultGridData(newGridData);

    /**
     * Hier muss extra eine funktion her, da wenn onGridSave aufgerufen wird, wird der alte state genommen
     * von defaultGridData -> state ist erst nach einem rerender neu gesetzt.
     */
    onGridSaveAfterDelete(newGridData);
  };

  /* #endregion */

  /* #region [Grid Cell Edit Functions] */
  const SaveSingleCellValue = (key: string, rowNum: number, defaultGridDataArr: any[]): any[] => {
    let defaultGridDataTmp: any[] = [];
    defaultGridDataTmp = [...defaultGridDataArr];
    var internalRowNumDefaultGrid = defaultGridDataTmp.findIndex((row) => row._grid_row_id_ === rowNum);
    var internalRowNumActivateGrid = activateCellEdit.findIndex((row) => row['properties']['_grid_row_id_']['value'] === rowNum);
    defaultGridDataTmp[internalRowNumDefaultGrid][key] = activateCellEdit[internalRowNumActivateGrid]['properties'][key]['value'];
    if (defaultGridDataTmp[internalRowNumDefaultGrid]['_grid_row_operation_'] !== Operation.Add) {
      defaultGridDataTmp[internalRowNumDefaultGrid]['_grid_row_operation_'] = Operation.Update;
    }
    return defaultGridDataTmp;
  };

  const onCellValueChange = (
    ev: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    text: string,
    item: {},
    row: number,
    key: string,
    column: IColumnConfig
  ): void => {
    if (!IsValidDataType(column.dataType, text)) {
      return;
    }

    setGridEditState(true);

    let activateCellEditTmp: any[] = [];
    activateCellEdit.forEach((item, index) => {
      if (row === index) {
        item.properties[key].value = text;
      }

      activateCellEditTmp.push(item);
    });

    if (column.onChange) {
      HandleColumnOnChange(activateCellEditTmp, row, column);
    }
    // Custom: every time a value in a cell changed, we want to save
    saveData();
  };

  const CheckCellOnChangeCallBack = (defaultGridDataTmp: any[], row: Number[], column: IColumnConfig): any[] => {
    var callbackRequestparams: ICallBackParams = {
      data: defaultGridDataTmp,
      rowindex: row,
      triggerkey: column.key,
      activatetriggercell: false,
    };

    defaultGridDataTmp = column.onChange(callbackRequestparams);
    return defaultGridDataTmp;
  };

  const onDoubleClickEvent = (key: string, rowNum: number, activateCurrentCell: boolean): void => {
    EditCellValue(key, rowNum, activateCurrentCell);
  };

  const onCellPickerDoubleClickEvent = (key: string, rowNum: number, activateCurrentCell: boolean): void => {
    EditCellValue(key, rowNum, activateCurrentCell);
  };

  const onDropdownDoubleClickEvent = (key: string, rowNum: number, activateCurrentCell: boolean): void => {
    EditCellValue(key, rowNum, activateCurrentCell);
  };

  const onKeyDownEvent = (
    event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    column: IColumnConfig,
    rowNum: number,
    activateCurrentCell: boolean
  ): void => {
    if (event.key === 'Enter') {
      if (!activateCellEdit[rowNum].isActivated) {
        EditCellValue(column.key, rowNum, activateCurrentCell);
        event.preventDefault();
      }
    }
  };

  const onCellDateChange = (date: Date | null | undefined, item1: {}, row: number, column: IColumnConfig): void => {
    setGridEditState(true);

    let activateCellEditTmp: any[] = [];
    activateCellEdit.forEach((item, index) => {
      if (row === index) {
        item.properties[column.key].value = dateToISOLikeButLocal(date);
      }

      activateCellEditTmp.push(item);
    });

    if (column.onChange) {
      HandleColumnOnChange(activateCellEditTmp, row, column);
    }

    setActivateCellEdit(activateCellEditTmp);
  };

  const saveData = () => {
    let defaultGridDataTmp: any[] = [];
    defaultGridData.forEach((item, rowNum) => {
      defaultGridDataTmp = SaveRowValue(item, item['_grid_row_id_'], defaultGridData);
    });
    setDefaultGridData(defaultGridDataTmp);
    onGridSave();
  };

  const onCellPickerTagListChanged = (cellPickerTagList: ITag[] | undefined, row: number, column: IColumnConfig): void => {
    setGridEditState(true);

    let activateCellEditTmp: any[] = [];
    activateCellEdit.forEach((item, index) => {
      if (row === index) {
        item.properties[column.key].value = cellPickerTagList && cellPickerTagList[0] && cellPickerTagList[0].name ? cellPickerTagList![0].name : '';
      }

      activateCellEditTmp.push(item);
    });

    if (column.onChange) {
      HandleColumnOnChange(activateCellEditTmp, row, column);
    }

    setActivateCellEdit(activateCellEditTmp);
  };

  const onDropDownChange = (
    event: React.FormEvent<HTMLDivElement>,
    selectedDropdownItem: IDropdownOption | undefined,
    row: number,
    column: IColumnConfig
  ): void => {
    setGridEditState(true);

    let activateCellEditTmp: any[] = [];
    activateCellEdit.forEach((item, index) => {
      if (row === index) {
        item.properties[column.key].value = selectedDropdownItem?.text;
      }

      activateCellEditTmp.push(item);
    });

    if (column.onChange) {
      HandleColumnOnChange(activateCellEditTmp, row, column);
    }

    setActivateCellEdit(activateCellEditTmp);
    saveData();
  };

  const onCheckboxChanged = (event: React.FormEvent<HTMLElement | HTMLInputElement>, checked: boolean, row: number, column: IColumnConfig): void => {
    setGridEditState(true);

    let activateCellEditTmp: any[] = [];
    activateCellEdit.forEach((item, index) => {
      if (row === index) {
        item.properties[column.key].value = checked;
      }

      activateCellEditTmp.push(item);
    });

    if (column.onChange) {
      HandleColumnOnChange(activateCellEditTmp, row, column);
    }

    setActivateCellEdit(activateCellEditTmp);
    saveData();
  };

  const ChangeCellState = (key: string, rowNum: number, activateCurrentCell: boolean, activateCellEditArr: any[]): any[] => {
    let activateCellEditTmp: any[] = [];
    activateCellEditTmp = [...activateCellEditArr];

    if (activateCellEditTmp[rowNum]['properties'][key]) {
      activateCellEditTmp[rowNum]['properties'][key]['activated'] = activateCurrentCell;
    } else {
      console.log(activateCellEditTmp[rowNum]['properties'][key]);
      debugger;
    }
    return activateCellEditTmp;
  };

  const EditCellValue = (key: string, rowNum: number, activateCurrentCell: boolean): void => {
    let activateCellEditTmp: any[] = ChangeCellState(key, rowNum, activateCurrentCell, activateCellEdit);
    setActivateCellEdit(activateCellEditTmp);

    if (!activateCurrentCell) {
      let defaultGridDataTmp: any[] = SaveSingleCellValue(key, rowNum, defaultGridData);
      setDefaultGridData(defaultGridDataTmp);
    }
  };

  const HandleColumnOnChange = (activateCellEditTmp: any[], row: number, column: IColumnConfig): void => {
    var arr: any[] = [];
    activateCellEditTmp.forEach((item, index) => {
      var rowObj: any = {};
      var objectKeys = Object.keys(item.properties);
      objectKeys.forEach((objKey) => {
        rowObj[objKey] = item.properties[objKey].value;
      });
      arr.push(rowObj);
    });

    var defaultGridDataTmp = CheckCellOnChangeCallBack(arr, [row], column);
    setDefaultGridData(defaultGridDataTmp);
    activateCellEditTmp = ShallowCopyDefaultGridToEditGrid(defaultGridDataTmp, activateCellEditTmp);
  };
  /* #endregion */

  /* #region [Grid Row Edit Functions] */
  const ChangeRowState = (item: any, rowNum: number, enableTextField: boolean): any[] => {
    let activateCellEditTmp: any[] = [...activateCellEdit];
    var objectKeys = Object.keys(item);
    objectKeys
      .filter((key) => key !== '_grid_row_id_' && key !== '_grid_row_operation_')
      .forEach((objKey) => {
        activateCellEditTmp = ChangeCellState(objKey, rowNum, enableTextField, activateCellEditTmp);
      });

    activateCellEditTmp[rowNum]['isActivated'] = enableTextField;

    return activateCellEditTmp;
  };

  const SaveRowValue = (item: any, rowNum: number, defaultGridDataArr: any[]): any[] => {
    let defaultGridDataTmp: any[] = [];
    defaultGridDataTmp = [...defaultGridDataArr];

    var objectKeys = Object.keys(item);
    objectKeys
      .filter((key) => key !== '_grid_row_id_' && key !== '_grid_row_operation_')
      .forEach((objKey) => {
        defaultGridDataTmp = SaveSingleCellValue(objKey, rowNum, defaultGridData);
      });

    return defaultGridDataTmp;
  };
  /* #endregion */

  /* #region [Grid Edit Mode Functions] */
  const ShowGridEditMode = (): void => {
    // TODO: activate editmode with props?
    // TODO: brauchen wir den ganzen kram hier überhaupt noch?
    var newEditModeValue = true; //!editMode;
    if (newEditModeValue) {
      setCancellableRows(defaultGridData);
    } else {
      setCancellableRows([]);
    }
    let activateCellEditTmp: any[] = [];

    defaultGridData.forEach((item, rowNum) => {
      activateCellEditTmp = ChangeRowState(item, item['_grid_row_id_'], newEditModeValue);
    });

    setActivateCellEdit(activateCellEditTmp);

    setEditMode(newEditModeValue);

    // wenn dieses saveData() drin ist, lädt nix!
    // saveData();
  };

  /* #endregion */

  const RowSelectOperations = (type: EditType, item: {}): boolean => {
    switch (type) {
      case EditType.BulkEdit:
        if (selectedIndices.length > 0) {
          setIsOpenForEdit(true);
        } else {
          ShowMessageDialog('No Rows Selected', 'Please select some rows to perform this operation');
        }
        break;
      case EditType.AddRow:
        AddRowsToGrid();
        //toggleHideDialog;
        break;
      case EditType.DeleteRow:
        if (selectedIndices.length > 0 && !undeletableRowSelected) {
          DeleteSelectedRows();
        } else if (undeletableRowSelected) {
          ShowMessageDialog('Undeletable', 'Die ausgewählte Zeile darf nicht gelöscht werden!');
        } else {
          ShowMessageDialog('No Rows Selected', 'Please select some rows to perform this operation');
        }
        break;
      case EditType.ColumnFilter:
        ShowColumnFilterDialog();
        break;
      case EditType.AddRowWithData:
        setIsOpenForAdd(true);
        break;
      case EditType.MoveUp:
        MoveRow(-1);
        break;
      case EditType.MoveDown:
        MoveRow(1);
        break;
    }

    return true;
  };

  /* #region [Column Click] */
  const onColumnClick = (ev: React.MouseEvent<HTMLElement>, column: IColumn, index: number) => {
    ev.preventDefault();
    ShowFilterForColumn(column, index);
  };

  const onColumnContextMenu = (column: IColumn | undefined, ev: React.MouseEvent<HTMLElement> | undefined) => {
    // ev!.preventDefault();
    var newColumns: IColumn[] = GridColumns.slice();
    const currColumn: IColumn = newColumns.filter((currCol) => column!.key === currCol.key)[0];
    newColumns.forEach((newCol: IColumn) => {
      if (newCol === currColumn) {
        currColumn.isSortedDescending = !currColumn.isSortedDescending;
        currColumn.isSorted = true;
      } else {
        newCol.isSorted = false;
        newCol.isSortedDescending = true;
      }
    });

    const newItems = _copyAndSort(defaultGridData, currColumn.fieldName!, currColumn.isSortedDescending);
    SetGridItems(newItems);
    setSortColObj({ key: column!.key, isAscending: !currColumn.isSortedDescending, isEnabled: true });
  };

  function _copyAndSort<T>(items: T[], columnKey: string, isSortedDescending?: boolean): T[] {
    const key = columnKey as keyof T;
    return items.slice(0).sort((a: T, b: T) => ((isSortedDescending ? a[key] < b[key] : a[key] > b[key]) ? 1 : -1));
  }
  /* #endregion */

  /* #region [Column Filter] */
  const getFilterStoreRef = (): IFilter[] => {
    return filterStoreRef.current;
  };

  const setFilterStoreRef = (value: IFilter[]): void => {
    filterStoreRef.current = value;
  };

  const clearFilterStoreRef = (): void => {
    filterStoreRef.current = [];
  };

  const CloseColumnFilterDialog = (): void => {
    setIsColumnFilterClicked(false);
  };

  const ShowColumnFilterDialog = (): void => {
    setIsColumnFilterClicked((s) => !s);
  };

  const onFilterApplied = (filter: IFilter): void => {
    var tags: ITag[] = [...defaultTag];
    tags.push({ name: "'" + filter.column.key + "'" + filter.operator + "'" + filter.value + "'", key: filter.column.key });

    var filterStoreTmp: IFilter[] = getFilterStoreRef();
    filterStoreTmp.push(filter);

    setFilterStoreRef(filterStoreTmp);
    setFilteredColumns((filteredColumns) => [...filteredColumns, filter.column]);
    setDefaultTag(tags);
    CloseColumnFilterDialog();
  };

  const ClearFilters = (): void => {
    setDefaultTag([]);
    clearFilterStoreRef();
    setFilteredColumns([]);
  };

  const onFilterTagListChanged = React.useCallback((tagList: ITag[] | undefined): void => {
    if (tagList != null && tagList.length === 0) {
      ClearFilters();
      return;
    }

    var filterStoreTmp: IFilter[] = [];
    tagList!.forEach((item) => {
      var storeRow = getFilterStoreRef().filter((val) => val.column.key === item.key);
      if (storeRow.length > 0) {
        filterStoreTmp.push(storeRow[0]);
      }
    });

    setFilterStoreRef(filterStoreTmp);
    var filteredColumnsTmp: IColumnConfig[] = [];
    filteredColumnsTmp = props.columns.filter((item) => tagList!.filter((val) => val.key === item.key).length > 0);
    setFilteredColumns(filteredColumnsTmp);
    setDefaultTag(tagList!);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onFilterChanged = React.useCallback((filterText: string, tagList: ITag[] | undefined): ITag[] => {
    var emptyITag: ITag[] = [];
    return emptyITag;
  }, []);

  const getTextFromItem = (item: ITag): string => {
    return item.name;
  };

  const pickerSuggestionsProps: IBasePickerSuggestionsProps = {
    suggestionsHeaderText: 'Suggested tags',
    noResultsFoundText: 'No item tags found',
  };

  const inputProps: IInputProps = {
    'aria-label': 'Tag Picker',
  };
  /* #endregion [Column Filter] */

  /* #region [Grid Column Filter] */
  const onFilterApply = (filter: IFilterListProps): void => {
    UpdateColumnFilterValues(filter);
    var GridColumnFilterArr: IGridColumnFilter[] = getColumnFiltersRef();
    var filteredData = applyGridColumnFilter(defaultGridData, GridColumnFilterArr);
    getColumnFiltersRefForColumnKey(filter.columnKey).isApplied =
      filter.filterList.filter((i) => i.isChecked).length > 0 && filter.filterList.filter((i) => i.isChecked).length < filter.filterList.length
        ? true
        : false;
    var activateCellEditTmp = ShallowCopyDefaultGridToEditGrid(defaultGridData, activateCellEdit);
    setDefaultGridData(filteredData);
    setActivateCellEdit(activateCellEditTmp);
    setGridData(filteredData);
    setFilterCalloutComponent(undefined);
  };

  const UpdateColumnFilterValues = (filter: IFilterListProps): void => {
    var gridColumnFilter: IGridColumnFilter = getColumnFiltersRefForColumnKey(filter.columnKey);
    gridColumnFilter.filterCalloutProps!.filterList = filter.filterList;
    gridColumnFilter.isHidden = true;
    gridColumnFilter.isApplied = true;
  };

  const ShowFilterForColumn = (column: IColumn, index: number): void => {
    var filter: IGridColumnFilter = getColumnFiltersRefAtIndex(index);
    filter.isHidden = !filter.isHidden;
    if (filter.isHidden) {
      setFilterCalloutComponent(undefined);
      return;
    }

    var filters: IGridColumnFilter[] = getColumnFiltersRef();
    filters.filter((item) => item.index !== filter.index && item.column.key !== filter.column.key).map((item) => (item.isHidden = true));

    filter.filterCalloutProps!.filterList = GetUniqueColumnValues(column, filter.filterCalloutProps!.filterList);

    setFilterCalloutComponent(
      <FilterCallout
        onCancel={() => {
          setFilterCalloutComponent(undefined);
        }}
        onApply={onFilterApply}
        columnKey={filter.filterCalloutProps!.columnKey}
        columnName={filter.filterCalloutProps!.columnName}
        filterList={filter.filterCalloutProps!.filterList}
        columnClass={filter.filterCalloutProps!.columnClass}
      />
    );
  };

  const disable = (item: any, colKey: string): boolean => {
    if (item.Options && item.Options[colKey + '_grid_row_checkbox_disabled_'] !== undefined) {
      return item.Options[colKey + '_grid_row_checkbox_disabled_'];
    }
    return true;
  };

  const GetUniqueColumnValues = (column: IColumn, prevFilters: IFilterItem[]): IFilterItem[] => {
    var uniqueVals: string[] = [
      ...new Set(
        defaultGridData
          .filter(
            (x) => x._grid_row_operation_ !== Operation.Delete && x._is_filtered_in_column_filter_ === true && x._is_filtered_in_grid_search_ === true
          )
          .map((item) => item[column.fieldName!])
      ),
    ];
    var hiddenUniqueVals: string[] = [
      ...new Set(
        defaultGridData
          .filter(
            (x) =>
              x._grid_row_operation_ !== Operation.Delete && (x._is_filtered_in_column_filter_ === false || x._is_filtered_in_grid_search_ === false)
          )
          .map((item) => item[column.fieldName!])
      ),
    ];

    var filterItemArr: IFilterItem[] = [];
    if (!prevFilters || prevFilters.length === 0) {
      filterItemArr = uniqueVals.map((item) => {
        return { text: item, isChecked: true };
      });
    } else {
      filterItemArr = uniqueVals.map((item) => {
        var filters: IFilterItem[] = prevFilters.filter((i) => i.text === item);
        return { text: item, isChecked: filters.length > 0 ? filters[0].isChecked : true };
      });
    }

    return [
      ...filterItemArr,
      ...hiddenUniqueVals
        .filter((i) => !uniqueVals.includes(i))
        .map((i) => {
          return { text: i, isChecked: false };
        }),
    ];
  };

  const getColumnFiltersRef = (): IGridColumnFilter[] => {
    return gridColumnFilterArrRef.current;
  };

  const getColumnFiltersRefAtIndex = (index: number): IGridColumnFilter => {
    return gridColumnFilterArrRef.current[index];
  };

  const getColumnFiltersRefForColumnKey = (key: string): IGridColumnFilter => {
    var gridColumnFilterArr: IGridColumnFilter[] = [...gridColumnFilterArrRef.current];
    return gridColumnFilterArr.filter((item) => item.column.key === key)[0];
  };

  const setColumnFiltersRef = (value: IGridColumnFilter[]): void => {
    gridColumnFilterArrRef.current = value;
  };

  /* #endregion [Grid Column Filter] */

  const CreateColumnConfigs = (): IColumn[] => {
    let columnConfigs: IColumn[] = [];
    let columnFilterArrTmp: IGridColumnFilter[] = [];

    props.columns.forEach((column, index) => {
      var colHeaderClassName = 'id-' + props.id + '-col-' + index;
      var colKey = 'col' + index;
      var isDataTypeSupportedForFilter: boolean = isColumnDataTypeSupportedForFilter(column.dataType);

      if (!column.hidden) {
        columnConfigs.push({
          key: colKey,
          name: column.text,
          headerClassName: colHeaderClassName,
          ariaLabel: column.text,
          fieldName: column.key,
          isResizable: true,
          minWidth: column.minWidth,
          maxWidth: column.maxWidth,
          onColumnContextMenu: !column.disableSort ? (col, ev) => onColumnContextMenu(col, ev) : undefined,
          onColumnClick:
            !(isGridInEdit || editMode) && isDataTypeSupportedForFilter && column.applyColumnFilter && props.enableColumnFilters
              ? (ev, col) => onColumnClick(ev, col, index)
              : undefined,
          //data: item.dataType,
          isSorted: sortColObj.isEnabled && sortColObj.key === colKey,
          isSortedDescending: !(sortColObj.isEnabled && sortColObj.key === colKey) || !sortColObj.isAscending,
          isFiltered:
            isDataTypeSupportedForFilter &&
            column.applyColumnFilter &&
            props.enableColumnFilters &&
            getColumnFiltersRef() &&
            getColumnFiltersRef().length > 0 &&
            getColumnFiltersRef().filter((i) => i.column.key === column.key).length > 0 &&
            getColumnFiltersRef().filter((i) => i.column.key === column.key)[0].isApplied
              ? true
              : false,
          sortAscendingAriaLabel: 'Sorted A to Z',
          sortDescendingAriaLabel: 'Sorted Z to A',
          onRender: (item, rowNum) => {
            rowNum = Number(item['_grid_row_id_']);
            switch (column.inputType) {
              case EditControlType.MultilineTextField:
                return (
                  <span>
                    {!column.editable ||
                    !(
                      activateCellEdit &&
                      activateCellEdit[rowNum!] &&
                      activateCellEdit[rowNum!]['properties'][column.key] &&
                      activateCellEdit[rowNum!]['properties'][column.key].activated
                    ) ? (
                      <span
                        className={GetDynamicSpanStyles(column, item[column.key])}
                        onClick={() =>
                          props.enableCellEdit === true && column.editable === true && props.enableSingleClickCellEdit
                            ? EditCellValue(column.key, rowNum!, true)
                            : null
                        }
                        onDoubleClick={() =>
                          props.enableCellEdit === true && column.editable === true && !props.enableSingleClickCellEdit
                            ? EditCellValue(column.key, rowNum!, true)
                            : null
                        }>
                        {item[column.key]}
                      </span>
                    ) : (
                      <TextField
                        hidden={column.hidden || false}
                        label={item.text}
                        ariaLabel="Value"
                        name={column.key}
                        multiline={true}
                        rows={1}
                        styles={textFieldStyles}
                        onChange={(ev, text) => onCellValueChange(ev, text!, item, rowNum!, column.key, column)}
                        autoFocus={
                          true &&
                          !editMode &&
                          !(
                            activateCellEdit &&
                            activateCellEdit[Number(item['_grid_row_id_'])!] &&
                            activateCellEdit[Number(item['_grid_row_id_'])!]['isActivated']
                          )
                        }
                        //value = {item[column.key]}
                        value={activateCellEdit[rowNum!]['properties'][column.key].value}
                        //onKeyDown={(event) => onKeyDownEvent(event, column.key, rowNum, false)}
                        onDoubleClick={() => (!activateCellEdit[rowNum!].isActivated ? onDoubleClickEvent(column.key, rowNum!, false) : null)}
                        maxLength={column.maxLength !== null ? column.maxLength : 10000}
                      />
                    )}
                  </span>
                );
              case EditControlType.Date:
                return (
                  <span>
                    {!column.editable ||
                    !(
                      activateCellEdit &&
                      activateCellEdit[rowNum!] &&
                      activateCellEdit[rowNum!]['properties'][column.key] &&
                      activateCellEdit[rowNum!]['properties'][column.key].activated
                    ) ? (
                      <span
                        className={GetDynamicSpanStyles(column, item[column.key])}
                        onClick={() =>
                          props.enableCellEdit === true && column.editable === true && props.enableSingleClickCellEdit
                            ? EditCellValue(column.key, rowNum!, true)
                            : null
                        }
                        onDoubleClick={() =>
                          props.enableCellEdit === true && column.editable === true && !props.enableSingleClickCellEdit
                            ? EditCellValue(column.key, rowNum!, true)
                            : null
                        }>
                        {item && item[column.key] ? new Date(item[column.key]).toDateString() : null}
                      </span>
                    ) : (
                      <DatePicker
                        strings={DayPickerStrings}
                        placeholder="Select a date..."
                        ariaLabel="Select a date"
                        value={new Date(activateCellEdit[rowNum!].properties[column.key].value)}
                        onSelectDate={(date) => onCellDateChange(date, item, rowNum!, column)}
                        onDoubleClick={() => (!activateCellEdit[rowNum!].isActivated ? onDoubleClickEvent(column.key, rowNum!, false) : null)}
                        hidden={column.hidden || false}
                      />
                    )}
                  </span>
                );
              case EditControlType.DropDown:
                return (
                  <span className={'row-' + rowNum! + '-col-' + index}>
                    {!column.editable ||
                    !(
                      activateCellEdit &&
                      activateCellEdit[rowNum!] &&
                      activateCellEdit[rowNum!]['properties'][column.key] &&
                      activateCellEdit[rowNum!]['properties'][column.key].activated
                    ) ? (
                      <span
                        className={GetDynamicSpanStyles(column, item[column.key])}
                        onClick={() =>
                          props.enableCellEdit === true && column.editable === true && props.enableSingleClickCellEdit
                            ? EditCellValue(column.key, rowNum!, true)
                            : null
                        }
                        onDoubleClick={() =>
                          props.enableCellEdit === true && column.editable === true && !props.enableSingleClickCellEdit
                            ? EditCellValue(column.key, rowNum!, true)
                            : null
                        }>
                        {item[column.key]}
                      </span>
                    ) : (
                      <Dropdown
                        placeholder={column.dropdownValues?.filter((x) => x.text === item[column.key])[0]?.text ?? 'Select an option'}
                        options={column.dropdownValues ?? []}
                        styles={dropdownStyles}
                        onChange={(ev, selectedItem) => onDropDownChange(ev, selectedItem, rowNum!, column)}
                        onDoubleClick={() => (!activateCellEdit[rowNum!].isActivated ? onDropdownDoubleClickEvent(column.key, rowNum!, false) : null)}
                        hidden={column.hidden || false}
                      />
                    )}
                  </span>
                );
              case EditControlType.Checkbox:
                return (
                  <span className={'row-' + rowNum! + '-col-' + index}>
                    {!column.editable ||
                    !(
                      activateCellEdit &&
                      activateCellEdit[rowNum!] &&
                      activateCellEdit[rowNum!]['properties'][column.key] &&
                      activateCellEdit[rowNum!]['properties'][column.key].activated
                    ) ? (
                      <span
                        className={GetDynamicSpanStyles(column, item[column.key])}
                        onClick={() =>
                          props.enableCellEdit === true && column.editable === true && props.enableSingleClickCellEdit
                            ? EditCellValue(column.key, rowNum!, true)
                            : null
                        }
                        onDoubleClick={() =>
                          props.enableCellEdit === true && column.editable === true && !props.enableSingleClickCellEdit
                            ? EditCellValue(column.key, rowNum!, true)
                            : null
                        }>
                        {item[column.key]}
                      </span>
                    ) : (
                      <Checkbox
                        label={''}
                        // checked={activateCellEdit[rowNum!]['properties'][column.key].value}
                        checked={item[column.key]}
                        onChange={(e, item) => onCheckboxChanged(e!, item!, rowNum!, column)}
                        disabled={disable(item, column.key)}
                        //value = {item[column.key]}
                      />
                    )}
                  </span>
                );
              case EditControlType.Picker:
                return (
                  <span>
                    {!column.editable ||
                    !(
                      activateCellEdit &&
                      activateCellEdit[rowNum!] &&
                      activateCellEdit[rowNum!]['properties'][column.key] &&
                      activateCellEdit[rowNum!]['properties'][column.key].activated
                    ) ? (
                      <span
                        className={GetDynamicSpanStyles(column, item[column.key])}
                        onClick={() =>
                          props.enableCellEdit === true && column.editable === true && props.enableSingleClickCellEdit
                            ? EditCellValue(column.key, rowNum!, true)
                            : null
                        }
                        onDoubleClick={() =>
                          props.enableCellEdit === true && column.editable === true && !props.enableSingleClickCellEdit
                            ? EditCellValue(column.key, rowNum!, true)
                            : null
                        }>
                        {item[column.key]}
                      </span>
                    ) : (
                      <span
                        onDoubleClick={() =>
                          !activateCellEdit[rowNum!].isActivated ? onCellPickerDoubleClickEvent(column.key, rowNum!, false) : null
                        }>
                        <PickerControl
                          selectedItemsLimit={column.pickerOptions?.tagsLimit}
                          pickerTags={column.pickerOptions?.pickerTags ?? []}
                          defaultTags={item[column.key] ? [item[column.key]] : []}
                          minCharLimitForSuggestions={column.pickerOptions?.minCharLimitForSuggestions}
                          onTaglistChanged={(selectedItem: ITag[] | undefined) => onCellPickerTagListChanged(selectedItem, rowNum!, column)}
                          pickerDescriptionOptions={column.pickerOptions?.pickerDescriptionOptions}
                        />
                      </span>
                    )}
                  </span>
                );
              default:
                return (
                  <span>
                    {!column.editable ||
                    !(
                      activateCellEdit &&
                      activateCellEdit[rowNum!] &&
                      activateCellEdit[rowNum!]['properties'][column.key] &&
                      activateCellEdit[rowNum!]['properties'][column.key].activated
                    ) ||
                    (column.key === 'NameExtern' && (props.undeleteableKeys || []).indexOf(item['NameExtern']) >= 0) ? (
                      <span
                        className={GetDynamicSpanStyles(column, item[column.key])}
                        onClick={() =>
                          props.enableCellEdit === true && column.editable === true && props.enableSingleClickCellEdit
                            ? EditCellValue(column.key, rowNum!, true)
                            : null
                        }
                        onDoubleClick={() =>
                          props.enableCellEdit === true && column.editable === true && !props.enableSingleClickCellEdit
                            ? EditCellValue(column.key, rowNum!, true)
                            : null
                        }>
                        {item[column.key]}
                      </span>
                    ) : (
                      <TextField
                        required={item.required}
                        label={item.text}
                        ariaLabel="Value"
                        name={column.key}
                        styles={textFieldStyles}
                        onChange={(ev, text) => onCellValueChange(ev, text!, item, rowNum!, column.key, column)}
                        autoFocus={
                          true &&
                          !editMode &&
                          !(
                            activateCellEdit &&
                            activateCellEdit[Number(item['_grid_row_id_'])!] &&
                            activateCellEdit[Number(item['_grid_row_id_'])!]['isActivated']
                          )
                        }
                        //value = {item[column.key]}
                        value={activateCellEdit[rowNum!]['properties'][column.key].value}
                        onKeyDown={(event) => onKeyDownEvent(event, column, rowNum!, false)}
                        maxLength={column.maxLength !== null ? column.maxLength : 1000}
                      />
                    )}
                  </span>
                );
            }
          },
        });
      }

      if (getColumnFiltersRef().length === 0) {
        columnFilterArrTmp.push({
          index: index,
          column: column,
          isApplied: false,
          isHidden: true,
          filterCalloutProps: {
            columnKey: column.key,
            columnClass: colHeaderClassName,
            columnName: column.text,
            filterList: [],
          },
        });
      }
    });

    if (getColumnFiltersRef().length === 0) {
      setColumnFiltersRef(columnFilterArrTmp);
    }

    return columnConfigs;
  };

  const CreateCommandBarItemProps = (): ICommandBarItemProps[] => {
    let commandBarItems: ICommandBarItemProps[] = [];

    if (props.enableColumnFilterRules) {
      commandBarItems.push({
        key: 'columnFilters',
        text: 'Filter',
        ariaLabel: 'Filter',
        // disabled: isGridInEdit || editMode,
        // Custom - Alex: we always want a filter!
        disabled: false,
        cacheKey: 'myColumnFilterCacheKey',
        iconProps: { iconName: 'Filter' },
        subMenuProps: {
          items: [
            {
              key: 'columnFilter',
              text: 'Column Filter',
              iconProps: { iconName: 'Filter' },
              onClick: () => RowSelectOperations(EditType.ColumnFilter, {}),
            },
            {
              key: 'clearFilters',
              text: 'Clear Filters',
              iconProps: { iconName: 'ClearFilter' },
              onClick: () => ClearFilters(),
            },
          ],
        },
      });
    }

    if (props.enableGridRowsAdd) {
      commandBarItems.push({
        key: 'addrows',
        text: 'Zeile hinzufügen',
        // disabled: isGridInEdit || editMode,
        // Custom - Alex: we always want to add rows!
        disabled: false,
        iconProps: { iconName: 'AddTo' },
        onClick: () => RowSelectOperations(EditType.AddRow, {}),
      });
    }

    if (props.enableGridRowsDelete) {
      commandBarItems.push({
        key: 'deleterows',
        text: 'Zeile löschen',
        // disabled: isGridInEdit || editMode,
        // Custom - Alex: we always want to delete rows!
        disabled: false,
        iconProps: { iconName: 'DeleteRows' },
        onClick: () => RowSelectOperations(EditType.DeleteRow, {}),
      });
    }

    if (props.enableGridRowsSort && selectedItems && selectedItems.length === 1) {
      commandBarItems.push({
        key: 'sortrowsup',
        text: '',
        disabled: false,
        iconProps: { iconName: 'sortup' },
        onClick: () => RowSelectOperations(EditType.MoveUp, {}),
      });

      commandBarItems.push({
        key: 'sortrowsdown',
        text: '',
        disabled: false,
        iconProps: { iconName: 'sortdown' },
        onClick: () => RowSelectOperations(EditType.MoveDown, {}),
      });
    }

    return commandBarItems;
  };

  const CreateCommandBarFarItemProps = (): ICommandBarItemProps[] => {
    let commandBarItems: ICommandBarItemProps[] = [];
    if (
      props.enableUnsavedEditIndicator &&
      (props.enableRowEdit || props.enableCellEdit || props.enableBulkEdit || props.enableColumnEdit || props.enableTextFieldEditMode)
    ) {
      commandBarItems.push({
        key: 'info',
        text: isGridStateEdited ? '' : '',
        // This needs an ariaLabel since it's icon-only
        ariaLabel: 'Info',
        disabled: !isGridStateEdited,
        iconOnly: true,
        iconProps: { iconName: 'InfoSolid' },
      });
    }

    return commandBarItems;
  };

  const GridColumns = CreateColumnConfigs();
  const CommandBarItemProps = CreateCommandBarItemProps();
  const CommandBarFarItemProps = CreateCommandBarFarItemProps();
  function _getSelectionDetails(): string {
    const count = _selection.getSelectedCount();
    setSelectionCount(count);
    setSelectedItems(_selection.getSelection());
    setSelectedIndices(_selection.getSelectedIndices());
    if (props.onGridSelectionChange) {
      props.onGridSelectionChange(_selection.getSelection());
    }

    switch (count) {
      case 0:
        console.log('No items selected');
        return 'No items selected';
      case 1:
        console.log('1 item selected');
        return '1 item selected: ';
      default:
        console.log(`${count} items selected`);
        return `${count} items selected`;
    }
  }

  const onRenderDetailsHeader: IRenderFunction<IDetailsHeaderProps> = (props, defaultRender) => {
    if (!props) {
      return null;
    }
    const onRenderColumnHeaderTooltip: IRenderFunction<IDetailsColumnRenderTooltipProps> = (tooltipHostProps) => (
      <TooltipHost {...tooltipHostProps} />
    );
    return (
      <Sticky stickyPosition={StickyPositionType.Header}>
        {defaultRender!({
          ...props,
          onRenderColumnHeaderTooltip,
        })}
      </Sticky>
    );
  };

  return (
    <Fabric>
      <Panel
        isOpen={isOpenForEdit}
        onDismiss={dismissPanelForEdit}
        isLightDismiss={true}
        headerText="Edit Grid Data"
        closeButtonAriaLabel="Close"
        type={PanelType.smallFixedFar}>
        <EditPanel onChange={onEditPanelChange} columnConfigurationData={props.columns} />
      </Panel>

      {props.enableRowAddWithValues && props.enableRowAddWithValues.enable ? (
        <Panel
          isOpen={isOpenForAdd}
          onDismiss={dismissPanelForAdd}
          isLightDismiss={true}
          headerText="Add Rows"
          closeButtonAriaLabel="Close"
          type={PanelType.smallFixedFar}>
          <AddRowPanel
            onChange={onAddPanelChange}
            columnConfigurationData={props.columns}
            enableRowsCounterField={props.enableRowAddWithValues.enableRowsCounterInPanel}
          />
        </Panel>
      ) : null}

      {defaultTag.length > 0 ? (
        <TagPicker
          onResolveSuggestions={onFilterChanged}
          getTextFromItem={getTextFromItem}
          pickerSuggestionsProps={pickerSuggestionsProps}
          inputProps={inputProps}
          selectedItems={defaultTag}
          onChange={onFilterTagListChanged}
        />
      ) : null}

      {props.enableCommandBar === undefined || props.enableCommandBar === true ? (
        <CommandBar items={CommandBarItemProps} ariaLabel="Command Bar" farItems={CommandBarFarItemProps} />
      ) : null}
      {showSpinner ? <Spinner label="Updating..." ariaLive="assertive" labelPosition="right" size={SpinnerSize.large} /> : null}

      {showFilterCallout && filterCalloutComponent}
      <div
        className={mergeStyles({
          height: props.height !== null ? props.height : '120vh',
          width: props.width !== null ? props.width : '130vh',
          position: 'relative',
          backgroundColor: 'white',
        })}>
        <ScrollablePane scrollbarVisibility={ScrollbarVisibility.auto} style={{ width: '100%' }}>
          <MarqueeSelection selection={_selection}>
            <DetailsList
              compact={true}
              items={
                defaultGridData.length > 0
                  ? defaultGridData.filter(
                      (x) =>
                        x._grid_row_operation_ !== Operation.Delete &&
                        x._is_filtered_in_ === true &&
                        x._is_filtered_in_grid_search_ === true &&
                        x._is_filtered_in_column_filter_ === true
                    )
                  : []
              }
              columns={GridColumns}
              selectionMode={props.selectionMode}
              layoutMode={DetailsListLayoutMode.fixedColumns}
              constrainMode={ConstrainMode.unconstrained}
              selection={_selection}
              setKey="none"
              onRenderDetailsHeader={onRenderDetailsHeader}
              ariaLabelForSelectAllCheckbox="Toggle selection for all items"
              ariaLabelForSelectionColumn="Toggle selection"
              checkButtonAriaLabel="Row checkbox"
              ariaLabel={props.ariaLabel}
              ariaLabelForGrid={props.ariaLabelForGrid}
              ariaLabelForListHeader={props.ariaLabelForListHeader}
              cellStyleProps={props.cellStyleProps}
              checkboxCellClassName={props.checkboxCellClassName}
              checkboxVisibility={props.checkboxVisibility}
              className={props.className}
              columnReorderOptions={props.columnReorderOptions}
              componentRef={props.componentRef}
              disableSelectionZone={props.disableSelectionZone}
              dragDropEvents={props.dragDropEvents}
              enableUpdateAnimations={props.enableUpdateAnimations}
              enterModalSelectionOnTouch={props.enterModalSelectionOnTouch}
              getCellValueKey={props.getCellValueKey}
              getGroupHeight={props.getGroupHeight}
              getKey={props.getKey}
              getRowAriaDescribedBy={props.getRowAriaDescribedBy}
              getRowAriaLabel={props.getRowAriaLabel}
              groupProps={props.groupProps}
              groups={props.groups}
              indentWidth={props.indentWidth}
              initialFocusedIndex={props.initialFocusedIndex}
              isHeaderVisible={props.isHeaderVisible}
              isPlaceholderData={props.isPlaceholderData}
              listProps={props.listProps}
              minimumPixelsForDrag={props.minimumPixelsForDrag}
              onActiveItemChanged={props.onActiveItemChanged}
              onColumnHeaderClick={props.onColumnHeaderClick}
              onColumnHeaderContextMenu={props.onColumnHeaderContextMenu}
              onColumnResize={props.onColumnResize}
              onDidUpdate={props.onDidUpdate}
              onItemContextMenu={props.onItemContextMenu}
              onItemInvoked={props.onItemInvoked}
              onRenderCheckbox={props.onRenderCheckbox}
              onRenderDetailsFooter={props.onRenderDetailsFooter}
              onRenderItemColumn={props.onRenderItemColumn}
              onRenderMissingItem={props.onRenderMissingItem}
              onRenderRow={props.onRenderRow}
              onRowDidMount={props.onRowDidMount}
              onRowWillUnmount={props.onRowWillUnmount}
              onShouldVirtualize={props.onShouldVirtualize}
              rowElementEventMap={props.rowElementEventMap}
              selectionPreservedOnEmptyClick={props.selectionPreservedOnEmptyClick}
              selectionZoneProps={props.selectionZoneProps}
              shouldApplyApplicationRole={props.shouldApplyApplicationRole}
              styles={props.styles}
              useFastIcons={props.useFastIcons}
              usePageCache={props.usePageCache}
              useReducedRowRenderer={props.useReducedRowRenderer}
              viewport={props.viewport}
            />
          </MarqueeSelection>
        </ScrollablePane>
      </div>
      <Dialog hidden={!dialogContent} onDismiss={CloseRenameDialog} closeButtonAriaLabel="Close">
        {dialogContent}
      </Dialog>
      {messageDialogProps.visible ? (
        <MessageDialog message={messageDialogProps.message} subMessage={messageDialogProps.subMessage} onDialogClose={CloseMessageDialog} />
      ) : null}

      {props.enableColumnEdit && isUpdateColumnClicked ? (
        <ColumnUpdateDialog columnConfigurationData={props.columns} onDialogCancel={CloseColumnUpdateDialog} onDialogSave={UpdateGridColumnData} />
      ) : null}

      {props.enableColumnFilterRules && isColumnFilterClicked ? (
        <ColumnFilterDialog
          columnConfigurationData={props.columns.filter(
            (item) => filteredColumns.indexOf(item) < 0 && isColumnDataTypeSupportedForFilter(item.dataType)
          )}
          onDialogCancel={CloseColumnFilterDialog}
          onDialogSave={onFilterApplied}
          gridData={defaultGridData}
        />
      ) : null}
    </Fabric>
  );
};

export default EditableGrid;
