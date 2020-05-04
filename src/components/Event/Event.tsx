/// <reference path="../../types/snarkdown.d.ts" />

import classNames from 'classnames';
import React from 'react';

import { Button } from 'components/Button/Button';

import styles from './Event.module.css';
import { Fade } from 'components/Fade/Fade';

export interface IEventActionVM {
  text: string;
  disabled?: boolean;
  onClick: () => void;
}

export interface IEventVM {
  title: string;
  text: string;
  actions: IEventActionVM[];
}

interface IEvent {
  className?: string;
  event: IEventVM;
}

export class Event extends React.PureComponent<IEvent> {
  public render() {
    const { className, event } = this.props;

    if (event == null) {
      return null;
    }

    return (
      <div className={styles.Backdrop} onClick={(e) => e.preventDefault()}>
        <Fade in>
          <div className={classNames(styles.Event, className)}>
            <div className={styles.Title}>{event.title}</div>
            <div className={styles.Description}>
              {event.text}
            </div>
            <div className={styles.Actions}>
              {
                event.actions.map((action, index) => (
                  <Button
                    key={index}
                    wide
                    disabled={action.disabled}
                    className={styles.Action}
                    onClick={action.onClick}
                  >
                    {action.text}
                  </Button>
                ))
              }
            </div>
          </div>
        </Fade>
      </div>
    );
  }
}
