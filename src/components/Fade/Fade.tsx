import React from 'react';
import { CSSTransition } from 'react-transition-group';

interface IFade {
  in: boolean;
}

export const Fade: React.FC<IFade> = ({ in: inProp, children }) => (
  <CSSTransition
    in={inProp}
    timeout={300}
    classNames='fade'
  >
    { inProp ? children : <span /> }
  </CSSTransition>
)