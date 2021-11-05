import React, { useEffect, useState } from 'react';
import { MessageBar, MessageBarType, mergeStyles, Stack } from '@fluentui/react';

const wrapperClass = mergeStyles({
  '> *:not(:last-child)': { marginBottom: '1.5em' },
  '> * > *:not(:last-child)': { marginBottom: '0.5em' },
});

interface IInfoBarProps {
  message: string;
  type: string;
  hidden: boolean;
}
const InfoBar: React.FunctionComponent<IInfoBarProps> = ({ message, type, hidden }: IInfoBarProps) => {
  const [messageType, setMessageType] = useState(MessageBarType.info);
  const [isHidden, setIsHidden] = useState(true);

  useEffect(() => {
    switch (type) {
      case 'error':
        setMessageType(MessageBarType.error);
        break;
      case 'info':
        setMessageType(MessageBarType.info);
        break;
      case 'warning':
        setMessageType(MessageBarType.warning);
        break;
      case 'success':
        setMessageType(MessageBarType.success);
        break;
      default:
        break;
    }
  }, [type]);

  useEffect(() => {
    setIsHidden(hidden);
  }, [hidden]);

  return (
    <Stack
      styles={{
        root: {
          marginTop: '1.25rem',
          marginBottom: '1.25rem',
        },
      }}>
      <div className={wrapperClass}>
        {!isHidden && (
          <MessageBar delayedRender={false} messageBarType={messageType}>
            {message}
          </MessageBar>
        )}
      </div>
    </Stack>
  );
};

export default InfoBar;
