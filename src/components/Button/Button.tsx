import classNames from 'classnames';
import React from 'react';

import styles from './Button.module.css';

interface IButton {
  className?: string;
  disabled?: boolean;
  wide?: boolean;
  title?: string;
  onClick: () => void;
}

export const Button: React.FC<IButton> = ({ className, children, disabled, title, wide, onClick }) => (
  <button
    className={classNames(className, styles.Button, { [styles.Wide]: wide })}
    disabled={disabled}
    type='button'
    title={title}
    onClick={disabled ? undefined : onClick}
  >
    {children}
  </button>
);
