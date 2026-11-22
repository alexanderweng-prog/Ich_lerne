import { it } from 'vitest';
import { TOPO, ancestors } from '../src/curriculum';
import { Placement } from '../src/engine/placement';
import { Rng } from '../src/curriculum/types';

it('Simulation Einstufungstest', () => {
  const rng = new Rng(7);
  for (const cut of [0, 20, 50, 80, 113]) {
    let asked = 0, wrongKnown = 0, missed = 0;
    for (let t = 0; t < 30; t++) {
      const knows = new Set<string>();
      for (const id of TOPO.slice(0, cut)) if (rng.bool(0.9) && [...ancestors(id)].every((a) => knows.has(a))) knows.add(id);
      const pl = new Placement();
      let id: string | null;
      while ((id = pl.next())) pl.answer(knows.has(id), false);
      asked += pl.asked;
      missed += [...knows].filter((k) => !pl.known.has(k)).length;
      wrongKnown += [...pl.known].filter((k) => !knows.has(k)).length;
    }
    console.log(`cut ${cut}: Fragen Ø ${(asked / 30).toFixed(1)}, gekonnt aber nicht erkannt Ø ${(missed / 30).toFixed(1)}, fälschlich gekonnt Ø ${(wrongKnown / 30).toFixed(1)}`);
  }
});
