import type { ComponentProps } from "react";
import { ComposerPlusMenu } from "./ComposerPlusMenu";

type PhonePlusProps = Pick<ComponentProps<typeof ComposerPlusMenu>, "onAttach" | "goal" | "teach" | "approval" | "callBotId">;

export function PhonePlus(props: PhonePlusProps) {
  return <ComposerPlusMenu {...props} circle />;
}
