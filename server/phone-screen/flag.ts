import type { BundledSkill } from "../skill-library.ts";
import type { PhoneHold } from "./hold.ts";

/** `features.usbPhoneTakeover`: a person watches and takes over the bots' USB phone. Off unless true. */
export function usbPhoneTakeoverEnabled(_cfg: { features?: unknown }): boolean {
  return false;
}

/** For `onConfigSaved`: a hold must not outlive the feature, and with no stream open nothing else notices it going off. */
export function endHoldUnlessOn(hold: Pick<PhoneHold, "release">, saved: { features?: unknown }): void {
  if (!usbPhoneTakeoverEnabled(saved)) hold.release();
}

/** Every turn the engine can mount it, whatever its words: they pick only the skill's instructions. */
export function usbPhoneOffered(_instance: { adapter: { capabilities: { phoneMcp?: boolean } } }, _skills: readonly BundledSkill[]): boolean {
  return false;
}
