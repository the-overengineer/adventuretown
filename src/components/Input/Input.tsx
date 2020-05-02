import classNames from 'classnames';
import React from 'react';

import styles from './Input.module.css';

interface IInput {
  className?: string;
  name: string;
  value?: string;
  label: string;
  error?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>, value: string) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>, value: string) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>, value: string) => void;
}

export class Input extends React.PureComponent<IInput> {
  public render() {
    const { className, error, name, value, label } = this.props;

    return (
      <div className={classNames(styles.Input, className, { [styles.Invalid]: error != null })}>
        <label
          htmlFor={name}
          className={styles.Label}
        >
          {label}
        </label>
        <input
          id={name}
          className={styles.Field}
          name={name}
          value={value || ''}
          type='text'
          onChange={this.onChange}
          onBlur={this.onBlur}
          onFocus={this.onFocus}
        />
        {
          error != null ? (
            <span className={styles.Error}>{error}</span>
          ) : null
        }
      </div>
    );
  }

  private onChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    if (this.props.onChange) {
      this.props.onChange(ev, ev.target.value)
    }
  }

  private onBlur = (ev: React.FocusEvent<HTMLInputElement>) => {
    if (this.props.onBlur) {
      this.props.onBlur(ev, ev.target.value)
    }
  }

  private onFocus = (ev: React.FocusEvent<HTMLInputElement>) => {
    if (this.props.onFocus) {
      this.props.onFocus(ev, ev.target.value)
    }
  }
}