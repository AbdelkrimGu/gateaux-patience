"use client";

import { useEffect, useEffectEvent, useLayoutEffect, useRef } from "react";
import { clearWizard, loadWizard, saveWizard, type WizardSnapshot } from "./memory";

/*
  Keeps the tiramisu wizard's basket and step across universes (07 §4.3).
  A thin layer AROUND the wizard's own state: the engine, the step logic and
  the order payload are untouched.

  - Restore once on mount, in a layout effect: on a client-side arrival
    (e.g. Gâteaux -> Tiramisu) the restored step paints directly, no flash.
    The snapshot is validated against the catalogue first (memory.ts).
  - Save on every change of step / mode / basket / size tab.
  - Clear once the order is sent.
*/

export function useWizardMemory(state: WizardSnapshot, restore: (snap: WizardSnapshot) => void, done: boolean) {
  const ready = useRef(false);
  const onRestore = useEffectEvent(restore);

  useLayoutEffect(() => {
    const snap = loadWizard();
    if (snap) onRestore(snap);
    ready.current = true;
  }, []);

  const { step, mode, bucket, activeCat } = state;
  useEffect(() => {
    if (!ready.current) return;
    if (done) clearWizard();
    else saveWizard({ step, mode, bucket, activeCat });
  }, [step, mode, bucket, activeCat, done]);
}
