import { DefaultButton, Dialog, DialogFooter, Dropdown, IDropdownOption, PrimaryButton, Stack, TextField } from "office-ui-fabric-react";
import React, { useEffect, useState } from "react";
import { IColumnConfig } from "../../types/columnconfigtype";
import { IFilter, operatorsArr } from "../../types/filterstype";
import { controlClass, dropdownStyles, modelProps, stackTokens, textFieldStyles } from "./columnfilterdialogStyles";

interface Props {
    columnConfigurationData: IColumnConfig[];
    gridData: any[];
    onDialogCancel?: any;
    onDialogSave?: any;
}

const ColumnFilterDialog = (props : Props) => {
    //const [gridColumn, setGridColumn] = useState('');
    const [gridColumn, setGridColumn] = useState<IColumnConfig>();
    const [operator, setOperator] = useState('');
    const [value, setValue] = useState('');
    //const [filter, setFilter] = useState<IFilter>({ column:'', operator:'', value: '' });
    
    const onSelectGridColumn = (event: React.FormEvent<HTMLDivElement>, item: IDropdownOption | undefined, index: number | undefined): void => {
        console.log(item)
        //setGridColumn(item!.key.toString());
        setGridColumn(props.columnConfigurationData.filter((val) => val.key === item!.key)[0]);
        // var filterTmp : IFilter = {...filter};
        // filterTmp.column = item!.key.toString();
        // setFilter(filterTmp);
    };

    const onSelectOperator = (event: React.FormEvent<HTMLDivElement>, item: IDropdownOption | undefined, index: number | undefined): void => {
        // debugger;
        console.log(item)
        setOperator(item!.text.toString());
        //var filterTmp : IFilter = {...filter};
        //filterTmp.operator = item!.text.toString();
        //setFilter(filterTmp);
    };

    const onSelectValue = (event: React.FormEvent<HTMLDivElement>, item: IDropdownOption | undefined, index: number | undefined): void => {
        console.log(item)
        setValue(item!.key.toString());
        // var filterTmp : IFilter = {...filter};
        // filterTmp.value = item!.key.toString();
        // setFilter(filterTmp);
    };

    const onTextUpdate = (ev: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, text: string): void => {
        console.log('Text Changed: ' + text);
        setValue(text);
        // var filterTmp : IFilter = {...filter};
        // filterTmp.value = text;
        // setFilter(filterTmp);
    };

    useEffect(() => {
        if(gridColumn && gridColumn.key && gridColumn.key.length > 0){
            var column = props.columnConfigurationData.filter(x => x.key === gridColumn!.key);
            if(column.length > 0){
                var valueOptions = createValueOptions(column[0]);
                switch(column[0].dataType){
                    case 'number':
                        setInputFieldContent(
                            <TextField
                                    className={controlClass.textFieldClass}
                                    placeholder="Value"
                                    onChange={(ev, text) => onTextUpdate(ev, text!)}
                                    styles={textFieldStyles}
                            />
                        );
                        setOperatorDropDownContent(<Dropdown
                            placeholder="Select the Column"
                            options={createCompareOptions()}
                            styles={dropdownStyles}
                            onChange={onSelectOperator}
                        />);
                        break;
                    case 'string':
                        setInputFieldContent(
                            <TextField
                                    className={controlClass.textFieldClass}
                                    placeholder="Value"
                                    onChange={(ev, text) => onTextUpdate(ev, text!)}
                                    styles={textFieldStyles}
                            />
                        );
                        setOperatorDropDownContent(<Dropdown
                            placeholder="Select the Column"
                            options={createCompareOptions()}
                            styles={dropdownStyles}
                            onChange={onSelectOperator}
                        />);
                        break;
                    case 'date':
                        setInputFieldContent(<Dropdown
                            placeholder="Select the Column"
                            options={valueOptions}
                            styles={dropdownStyles}
                            onChange={onSelectValue}
                        />)
                        setOperatorDropDownContent(<Dropdown
                            placeholder="Select the Column"
                            options={createCompareOptions()}
                            styles={dropdownStyles}
                            onChange={onSelectOperator}
                        />);
                        break;
                }
            }
        }
        
    }, [gridColumn]); // eslint-disable-line react-hooks/exhaustive-deps

    const createDropDownOptions = () : IDropdownOption[] => {
        let dropdownOptions: IDropdownOption[] = [];
        props.columnConfigurationData.forEach((item, index) => {
            dropdownOptions.push({ key: item.key, text: item.text});
        });

        return dropdownOptions;
    }

    const options = createDropDownOptions();

    const createCompareOptions = () : IDropdownOption[] => {
        // debugger;
        if(!(gridColumn && gridColumn.key && gridColumn.key.length > 0)){
            return [];
        }
        let dataType = props.columnConfigurationData.filter(x => x.key === gridColumn.key)[0].dataType;
        let dropdownOptions: IDropdownOption[] = [];
        let operatorsOptions : any[] = [];
        switch(dataType){
            case 'string':
                operatorsOptions = operatorsArr.filter((item) => item.type === 'string')[0].value;
                break;
            case 'number':
                operatorsOptions = operatorsArr.filter((item) => item.type === 'number')[0].value;
                break;
        }
        operatorsOptions.forEach((item, index) => {
            dropdownOptions.push({ key: item+index, text: item});
        });

        return dropdownOptions;
    }

    const createValueOptions = (column : IColumnConfig) : IDropdownOption[] => {
        var columnData = props.gridData.map((item) => item[column.key]);
        let dropdownOptions: IDropdownOption[] = [];
        columnData.forEach((item, index) => {
            dropdownOptions.push({ key: item+index, text: item});
        });

        return dropdownOptions;
    };

    //const compareOptions = createCompareOptions();

    const [inputFieldContent, setInputFieldContent] = React.useState<JSX.Element | undefined>(
        <Dropdown
                    placeholder="Select the Column"
                    options={options}
                    styles={dropdownStyles}
                    onChange={onSelectValue}
                />
    );

    const [operatorDropDownContent, setOperatorDropDownContent] = React.useState<JSX.Element | undefined>(
        <Dropdown
                    placeholder="Select the Column"
                    options={createCompareOptions()}
                    styles={dropdownStyles}
                    onChange={onSelectValue}
                />
    );

    const closeDialog = React.useCallback((): void => {
        if(props.onDialogCancel){
            props.onDialogCancel();
        }
        
        setInputFieldContent(undefined)
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const saveDialog = (): void => {
        // debugger;
        var filterObj : IFilter = { column: gridColumn!, operator: operator, value: value }
        if(props.onDialogSave){
            props.onDialogSave(filterObj);
        }

        setInputFieldContent(undefined);
    };

    return(
        <Dialog modalProps={modelProps} hidden={!inputFieldContent} onDismiss={closeDialog} closeButtonAriaLabel="Close">
            <Stack verticalAlign="start" tokens={stackTokens}>
                <Dropdown
                    placeholder="Select the Column"
                    options={options}
                    styles={dropdownStyles}
                    onChange={onSelectGridColumn}
                />
                {operatorDropDownContent}
                {inputFieldContent}
              </Stack>
              <DialogFooter>
                <PrimaryButton
                  // eslint-disable-next-line react/jsx-no-bind
                  onClick={saveDialog}
                  text="Save"
                />
                <DefaultButton 
                //onClick={closeDialog} 
                text="Cancel" />
              </DialogFooter>
        </Dialog>
    );
}

export default ColumnFilterDialog;