// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { DefaultButton, DetailsList, DetailsListLayoutMode, Fabric, mergeStyles, mergeStyleSets, SelectionMode, TextField } from 'office-ui-fabric-react';
import * as React from 'react';
import { useState } from 'react';
import EditableGrid from '../../libs/editablegrid/editablegrid';
import { ICallBackParams, ICallBackRequestParams } from '../../libs/types/callbackparams';
import { IColumnConfig } from '../../libs/types/columnconfigtype';
import { GridColumnConfig, GridItemsType } from './gridconfig';
import { EventEmitter, EventType } from '../../libs/eventemitter/EventEmitter.js';
import { Operation } from '../../libs/types/operation';

const Consumer = () => {

    const [items, setItems] = useState<GridItemsType[]>([]);

    const classNames = mergeStyleSets({
        controlWrapper: {
          display: 'flex',
          flexWrap: 'wrap',
        }
      });

    const GetRandomDate = (start : Date, end : Date) : Date => {
        var diff =  end.getTime() - start.getTime();
        var new_diff = diff * Math.random();
        var date = new Date(start.getTime() + new_diff);
        return date;
    }

    const GetRandomInt = (min : number, max : number) : number => {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    const SetDummyData = () : void => {
        var dummyData : GridItemsType[] = []
        for(var i = 1; i <= 100; i++){
            var randomInt = GetRandomInt(1,3);
            dummyData.push({
                id: i,
                name: 'Name'+ GetRandomInt(1, 10),
                age: GetRandomInt(20,40),
                designation: 'Designation' + GetRandomInt(1, 15),
                salary: GetRandomInt(35000, 75000),
                dateofjoining: '2010-10-10T14:57:10',
                payrolltype: randomInt % 3 == 0 ? 'Weekly' : randomInt % 3 == 1 ? 'Bi-Weekly' : 'Monthly',
                employmenttype: 'Employment Type' + GetRandomInt(1,12)
            });
        }

        setItems(dummyData);
    }

    React.useEffect(() => {
        SetDummyData();
    }, []);

    const onGridSave = (data: any[]): void => {
        alert('Grid Data Saved');
        console.log('Updated Rows');
        console.log(data.filter(item => item._grid_row_operation_ == Operation.Update));
        console.log('Added Rows');
        console.log(data.filter(item => item._grid_row_operation_ == Operation.Add));
        console.log('Deleted Rows');
        console.log(data.filter(item => item._grid_row_operation_ == Operation.Delete));
        console.log('Unchanged Rows');
        console.log(data.filter(item => item._grid_row_operation_ == Operation.None));
        setItems([...data]);
    };

    const onPayrollChanged = (callbackRequestParamObj : ICallBackParams): any[] => {
        alert('Payroll Changed');
        return callbackRequestParamObj.data;
    }

    const onDateChanged = (callbackRequestParamObj : ICallBackParams): any[] => {
        // debugger;
        alert('Date Changed');
        return callbackRequestParamObj.data;
    }

    const onEmploymentTypeChangedChanged = (callbackRequestParamObj : ICallBackParams): any[] => {
        // debugger;
        alert('Employment Type Changed');
        return callbackRequestParamObj.data;
    }

    const onDesignationChanged = (callbackRequestParamObj : ICallBackParams): any[] => {
        callbackRequestParamObj.rowindex.forEach((index) => {
            callbackRequestParamObj.data.filter((item) => item._grid_row_id_ == index).map((item) => item.salary = 30000);
        });

        return callbackRequestParamObj.data;
    }

    const attachGridValueChangeCallbacks = (columnConfig : IColumnConfig[]) : IColumnConfig[] => {
        //columnConfig.filter((item) => item.key == 'designation').map((item) => item.onChange = onDesignationChanged);
        //columnConfig.filter((item) => item.key == 'employmenttype').map((item) => item.onChange = onEmploymentTypeChangedChanged);
        //columnConfig.filter((item) => item.key == 'payrolltype').map((item) => item.onChange = onPayrollChanged);
        //columnConfig.filter((item) => item.key == 'dateofjoining').map((item) => item.onChange = onDateChanged);
        return columnConfig;
    };

    return (
        <Fabric>
            <div className={classNames.controlWrapper}>
                <TextField placeholder='Search Grid' className={mergeStyles({ width: '60vh', paddingBottom:'10px' })} onChange={(event) => EventEmitter.dispatch(EventType.onSearch, event)}/>
            </div>
            <EditableGrid
                id={1}
                enableColumnEdit={true}
                enableSave={true}
                columns={attachGridValueChangeCallbacks(GridColumnConfig)}
                layoutMode={DetailsListLayoutMode.justified}
                selectionMode={SelectionMode.multiple}
                enableRowEdit={true}
                enableRowEditCancel={true}
                enableBulkEdit={true}
                items={items}
                enableCellEdit={true}
                enableTextFieldEditMode={true}
                enableTextFieldEditModeCancel={true}
                enableGridRowsDelete={true}
                enableGridRowsAdd={true}
                height={'70vh'}
                width={'160vh'}
                position={'relative'}
                enableUnsavedEditIndicator={true}
                onGridSave={onGridSave}
                enableGridReset={true}
                enableColumnFilters={true}
                enableColumnFilterRules={true}
                enableRowAddWithValues={{enable : true, enableRowsCounterInPanel : true}}
            />
        </Fabric>
    );
};

export default Consumer;