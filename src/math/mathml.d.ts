// React's types don't list MathML elements yet; the browser renders them natively.
import 'react';

type MathMLProps = React.HTMLAttributes<HTMLElement> & {
  display?: 'block' | 'inline';
  width?: string;
  mathvariant?: string;
  stretchy?: string;
  form?: string;
  lspace?: string;
  rspace?: string;
};

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      math: MathMLProps;
      mrow: MathMLProps;
      mi: MathMLProps;
      mn: MathMLProps;
      mo: MathMLProps;
      mtext: MathMLProps;
      mspace: MathMLProps;
      msub: MathMLProps;
      msup: MathMLProps;
      msubsup: MathMLProps;
      munderover: MathMLProps;
      mfrac: MathMLProps;
      msqrt: MathMLProps;
      mroot: MathMLProps;
    }
  }
}
