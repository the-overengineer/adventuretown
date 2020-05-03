import classNames from 'classnames';
import React from 'react';

import { ICharacter, Gender } from 'types/state';

import styles from './Person.module.css';

interface IPerson {
  person: ICharacter;
}

const showName = (name: string): string => {
  if (name.length > 20) {
    return name.slice(0, 18) + '...';
  }

  return name;
}

export const Person: React.FC<IPerson> = ({ person }) => (
  <div className={styles.Person}>
    <div className={styles.Name}>{showName(person.name)}</div>
    <i className={classNames(styles.Gender, 'fas', person.gender === Gender.Male ? 'fa-mars' : 'fa-venus')} />
  </div>
);