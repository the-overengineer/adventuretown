import classNames from 'classnames';
import React from 'react';

import styles from './Input.module.css';


interface IRadio<T extends string> {
  className?: string;
  name: string;
  value?: T;
  options: T[];
  label: string;
  error?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>, value: T) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>, value: T) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>, value: T) => void;
}

export class Radio<T extends string> extends React.PureComponent<IRadio<T>> {
  public render() {
    const { className, error, name, value, label, options } = this.props;

    return (
      <div className={classNames(styles.Radio, className, { [styles.Invalid]: error != null })}>
        <label
          htmlFor={name}
          className={styles.Label}
        >
          {label}
        </label>
        <div className={styles.Options}>
          {
            options.map((option) => (
              <div
                key={option}
                className={styles.Option}
              >
                <input
                  className={styles.RadioButton}
                  name={name}
                  value={option}
                  checked={option === value}
                  type='radio'
                  onChange={this.onChange}
                  onBlur={this.onBlur}
                  onFocus={this.onFocus}
                />
                <span className={styles.OptionLabel}>{option}</span>
              </div>
            ))
          }
        </div>
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
      this.props.onChange(ev, ev.target.value as T)
    }
  }

  private onBlur = (ev: React.FocusEvent<HTMLInputElement>) => {
    if (this.props.onBlur) {
      this.props.onBlur(ev, ev.target.value as T)
    }
  }

  private onFocus = (ev: React.FocusEvent<HTMLInputElement>) => {
    if (this.props.onFocus) {
      this.props.onFocus(ev, ev.target.value as T)
    }
  }
}