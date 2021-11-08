import React from 'react';
import { Stack, IStackTokens, IStackStyles } from '@fluentui/react';
import './App.css';
import DataTable from './Examples/DataTable/DataTable';
import {SampleDataColumnConfig, SampleRows} from './Examples/DataTable/Config';
import { IDataTableRow } from './Examples/DataTable/DataTable';

const stackTokens: IStackTokens = { childrenGap: 15 };
const stackStyles: Partial<IStackStyles> = {
  root: {
    width: '960px',
    margin: '0 auto',
    textAlign: 'center',
    color: '#605e5c',
  },
};

export const App: React.FunctionComponent = () => {

  var minEntries = ['Name_1', 'Name_2', 'Name_3']
  var forbiddenNames = ['DebitCreditCode'];


  return (
    <Stack horizontalAlign="center" verticalAlign="center" verticalFill styles={stackStyles} tokens={stackTokens}>
      
      <DataTable
        title={'TestData'}
        undeleteableKeys={minEntries}
        index={10}
        columns={SampleDataColumnConfig}
        data={SampleRows}
        forbiddenValues={forbiddenNames}
        onSaveData={(data: IDataTableRow[]) => console.log("Saved")}
        onContextMenu={(e: React.MouseEvent<HTMLInputElement | HTMLTextAreaElement, MouseEvent>, overwrite: boolean) =>
          console.log("Context Menu")
        }
      />
    </Stack>
  );
};
