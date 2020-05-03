import React from 'react';

import styles from './StatBlock.module.css';

interface IStatBlock {
  label: string;
  value: number | string | JSX.Element;
}

export const StatBlock: React.FC<IStatBlock> = ({ label, value }) => (
  <div className={styles.StatBlock}>
    <div className={styles.Label}>{label}</div>
    <div className={styles.Value}>{value}</div>
  </div>
);
