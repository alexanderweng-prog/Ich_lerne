import type { AnswerSpec } from '../math/check';
import { mixed } from '../curriculum/fmt';

/** Die Musterlösung so, wie man sie eintippen würde. */
export function canonicalInput(a: AnswerSpec): string {
  switch (a.kind) {
    case 'number':
      if (a.form === 'mixed') return mixed(a.value);
      if (a.form === 'decimal') return String(a.value.toNumber());
      return a.value.toString();
    case 'solution': return `${a.variable} = ${a.value.toString()}`;
    case 'expr': return a.value;
    case 'formula': return `${a.variable} = ${a.value}`;
    case 'choice': return String(a.correct);
  }
}

/** Musterlösung als Anzeigetext. */
export function solutionText(a: AnswerSpec): string {
  if (a.kind === 'choice') return a.options[a.correct];
  return canonicalInput(a);
}
