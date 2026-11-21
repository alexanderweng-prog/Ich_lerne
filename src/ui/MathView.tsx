import type { ComponentChildren, VNode } from 'preact';
import { parse, type Node } from '../math/expr';

export const fmt = { decimalComma: false };

const MINUS = '−';

function numText(raw: string) {
  return fmt.decimalComma ? raw.replace('.', ',') : raw;
}

const unwrap = (n: Node): Node => (n.t === 'par' ? n.e : n);

function variablesIn(n: Node): boolean {
  if (n.t === 'var') return true;
  if (n.t === 'num') return false;
  if (n.t === 'neg' || n.t === 'par') return variablesIn(n.e);
  return variablesIn(n.l) || variablesIn(n.r);
}

function isImplicitRight(n: Node): boolean {
  return n.t === 'var' || n.t === 'par' || (n.t === 'bin' && n.op === '^' && n.l.t === 'var');
}
function isImplicitLeft(n: Node): boolean {
  if (n.t === 'num' || n.t === 'var' || n.t === 'par') return true;
  if (n.t === 'bin' && (n.op === '^' || (n.op === '/' && !n.colon))) return true;
  if (n.t === 'bin' && n.op === '*') return isImplicitLeft(n.r);
  return false;
}

function r(n: Node, key = 0): VNode | string {
  switch (n.t) {
    case 'num': return <span key={key}>{numText(n.raw)}</span>;
    case 'var': return <i key={key} class="mv">{n.name}</i>;
    case 'neg': return <span key={key}>{MINUS}{r(n.e)}</span>;
    case 'par': return <span key={key}>({r(n.e)})</span>;
    case 'bin':
      switch (n.op) {
        case '+': return <span key={key}>{r(n.l, 1)}<span class="op"> + </span>{r(n.r, 2)}</span>;
        case '-': return <span key={key}>{r(n.l, 1)}<span class="op"> {MINUS} </span>{r(n.r, 2)}</span>;
        case '*': {
          // Zahl in Klammern, z. B. 2 · (−3): Malpunkt zeigen. Variable oder Term-Klammer: 3x, 3(x + 2).
          const numberInParens = n.r.t === 'par' && (n.r.e.t === 'num' || (n.r.e.t === 'neg' && n.r.e.e.t === 'num') || (n.r.e.t === 'bin' && n.r.e.op === '/' && !variablesIn(n.r.e)));
          const leftNumberInParens = n.l.t === 'par' && !variablesIn(n.l);
          const implicit = isImplicitLeft(n.l) && isImplicitRight(n.r) && !numberInParens && !leftNumberInParens;
          return <span key={key}>{r(n.l, 1)}{implicit ? '' : <span class="op"> · </span>}{r(n.r, 2)}</span>;
        }
        case '/':
          if (n.colon) return <span key={key}>{r(n.l, 1)}<span class="op"> : </span>{r(n.r, 2)}</span>;
          return (
            <span key={key} class="frac">
              <span class="fn">{r(unwrap(n.l), 1)}</span>
              <span class="fd">{r(unwrap(n.r), 2)}</span>
            </span>
          );
        case '^': return <span key={key}>{r(n.l, 1)}<sup>{r(unwrap(n.r), 2)}</sup></span>;
      }
  }
}

const MIXED = /^\s*(-?)(\d+)\s+(\d+)\s*\/\s*(\d+)\s*$/;

/** Ein Mathe-Ausdruck (darf =, <, > enthalten). Fällt bei unlesbarem Text auf normalen Text zurück. */
export function MathExpr({ src }: { src: string }) {
  const mm = MIXED.exec(src);
  if (mm) {
    return (
      <span class="math">
        {mm[1] ? MINUS : ''}{mm[2]}
        <span class="frac"><span class="fn">{mm[3]}</span><span class="fd">{mm[4]}</span></span>
      </span>
    );
  }
  if (/[A-Za-z]{3,}|, |[{}…☐]/.test(src)) return <span class="math raw">{src.replace(/-/g, MINUS)}</span>;
  const parts = src.split(/(=|<|>|≤|≥)/);
  try {
    const out: ComponentChildren[] = parts.map((part, i) => {
      if (i % 2 === 1) return <span key={i} class="op rel"> {part} </span>;
      if (!part.trim()) return null;
      const m2 = MIXED.exec(part);
      if (m2) return <MathExpr key={i} src={part} />;
      return <span key={i}>{r(parse(part))}</span>;
    });
    return <span class="math">{out}</span>;
  } catch {
    return <span class="math raw">{src.replace(/-/g, MINUS)}</span>;
  }
}

/** Text mit eingebetteter Mathe zwischen $…$ */
export function Rich({ text }: { text: string }) {
  const parts = text.split('$');
  return (
    <>
      {parts.map((p, i) => (i % 2 === 1 ? <MathExpr key={i} src={p} /> : <span key={i}>{p}</span>))}
    </>
  );
}
