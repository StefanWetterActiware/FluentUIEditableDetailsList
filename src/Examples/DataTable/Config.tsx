// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { IColumnConfig } from "../../libs/types/columnconfigtype";
import { EditControlType } from "../../libs/types/editcontroltype";
import { IDataTableRow } from "./DataTable";

export const SampleDataColumnConfig: IColumnConfig[] = [
    {
      key: 'NameExtern',
      name: 'Name',
      text: 'Name',
      editable: true,
      dataType: 'string',
      required: true,
      minWidth: 100,
      maxWidth: 100,
      isResizable: true,
      includeColumnInExport: true,
      includeColumnInSearch: true,
      applyColumnFilter: true,
    },
    {
      key: 'Beschreibung',
      name: 'Description',
      text: 'Description',
      editable: true,
      dataType: 'string',
      minWidth: 100,
      maxWidth: 100,
      isResizable: true,
      includeColumnInExport: true,
      includeColumnInSearch: true,
      applyColumnFilter: true,
    },
    {
      key: 'Datentyp',
      name: 'Datatype',
      text: 'Datatype',
      editable: true,
      dataType: 'string',
      minWidth: 100,
      maxWidth: 100,
      isResizable: true,
      includeColumnInExport: true,
      includeColumnInSearch: true,
      inputType: EditControlType.DropDown,
      dropdownValues: [
        { key: 'text', text: 'text' },
        { key: 'num', text: 'num' },
        { key: 'date', text: 'date' },
        { key: 'bool', text: 'bool' },
      ],
    },
    {
      key: 'Quelle',
      name: 'Source',
      text: 'Source',
      editable: true,
      required: true,
      dataType: 'string',
      minWidth: 100,
      maxWidth: 100,
      isResizable: true,
      includeColumnInExport: true,
      includeColumnInSearch: true,
      applyColumnFilter: true,
    },
    {
      key: 'Gutschrift',
      name: 'Credit',
      text: 'Credit',
      editable: true,
      dataType: 'string',
      minWidth: 100,
      maxWidth: 100,
      isResizable: true,
      includeColumnInExport: true,
      includeColumnInSearch: true,
      inputType: EditControlType.DropDown,
      dropdownValues: [
        { key: 'true', text: 'ja' },
        { key: 'false', text: 'nein' },
      ],
    },
    {
      key: 'DebitCreditCodeSource',
      name: 'DebitCreditCodeSource',
      text: 'DebitCreditCodeSource',
      editable: true,
      dataType: 'string',
      minWidth: 100,
      maxWidth: 100,
      isResizable: true,
      includeColumnInExport: true,
      includeColumnInSearch: true,
      inputType: EditControlType.DropDown,
      dropdownValues: [
        { key: 'true', text: 'ja' },
        { key: 'false', text: 'nein' },
      ],
    },
    {
      key: 'Pflicht',
      name: 'Required',
      text: 'Required',
      editable: true,
      dataType: 'string',
      minWidth: 100,
      maxWidth: 100,
      isResizable: true,
      includeColumnInExport: true,
      includeColumnInSearch: true,
      inputType: EditControlType.DropDown,
      dropdownValues: [
        { key: 'true', text: 'ja' },
        { key: 'false', text: 'nein' },
      ],
    },
  ];


export const SampleRows : IDataTableRow[] = [
    {
        NameExtern: 'Name_1',
        Beschreibung: 'Desc_1',
        Datentyp: 'Datatype_1',
        Quelle: 'Source_1',
        Gutschrift: 'Credit_1',
        DebitCreditCodeSource: 'DebitCreditCodeSource_1',
        Pflicht: 'Required_1',
    },
    {
        NameExtern: 'Name_2',
        Beschreibung: 'Desc_2',
        Datentyp: 'Datatype_2',
        Quelle: 'Source_2',
        Gutschrift: 'Credit_2',
        DebitCreditCodeSource: 'DebitCreditCodeSource_2',
        Pflicht: 'Required_2',
    },
    {
        NameExtern: 'Name_3',
        Beschreibung: 'Desc_3',
        Datentyp: 'Datatype_3',
        Quelle: 'Source_3',
        Gutschrift: 'Credit_3',
        DebitCreditCodeSource: 'DebitCreditCodeSource_3',
        Pflicht: 'Required_3',
    },
    {
        NameExtern: 'DebitCreditCode',
        Beschreibung: 'Desc_4',
        Datentyp: 'Datatype_4',
        Quelle: 'Source_4',
        Gutschrift: 'Credit_4',
        DebitCreditCodeSource: 'DebitCreditCodeSource_4',
        Pflicht: 'Required_4',
    },
    {
        NameExtern: 'Name_5',
        Beschreibung: 'Desc_5',
        Datentyp: 'Datatype_5',
        Quelle: 'Source_5',
        Gutschrift: 'Credit_5',
        DebitCreditCodeSource: 'DebitCreditCodeSource_5',
        Pflicht: 'Required_5',
    }
];

export interface GridItemsType {
    id: number;
    name: string;
    age: number;
    designation: string;
    salary: number;
    dateofjoining: string;
    payrolltype: string;
    employmenttype: string
};