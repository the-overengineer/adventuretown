import classNames from 'classnames';
import React from 'react';

import { ICharacter, Gender } from 'types/state';

import styles from './Person.module.css';
import { describeJob } from 'utils/employment';
import { getAge } from 'utils/time';

interface IPerson {
  person: ICharacter;
  today: number;
}

const showName = (name: string): string => {
  if (name.length > 20) {
    return name.slice(0, 18) + '...';
  }

  return name;
}

export const Person: React.FC<IPerson> = ({ person, today }) => {
  const title = [
    `Age: ${getAge(person.dayOfBirth, today)}`,
    person.profession != null ? describeJob(person) : undefined,
    `Phys: ${person.physical}`,
    `Int: ${person.intelligence}`,
    `Edu: ${person.education}`,
    `Cha: ${person.charm}`,
  ].filter((it) => it != null).join('\n');
  return (
    <div
      className={styles.Person}
      title={title}
    >
      <div className={styles.Name}>{showName(person.name)}</div>
      <i className={classNames(styles.Gender, 'fas', person.gender === Gender.Male ? 'fa-mars' : 'fa-venus')} />
    </div>
  );
}