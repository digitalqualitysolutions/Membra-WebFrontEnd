"use client";

import { useState } from "react";

import { Icon } from "@/components/icons";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

type PasswordInputProps = Omit<
  React.ComponentProps<typeof InputGroupInput>,
  "type"
> & {
  /** Translated labels for the reveal toggle. */
  showLabel: string;
  hideLabel: string;
};

export function PasswordInput({
  showLabel,
  hideLabel,
  className,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <InputGroup>
      <InputGroupInput
        {...props}
        type={visible ? "text" : "password"}
        className={className}
      />

      <InputGroupAddon align="inline-end">
        <InputGroupButton
          variant="ghost"
          size="icon-sm"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? hideLabel : showLabel}
        >
          {/* Decorative: the button's aria-label already names the action. */}
          <Icon name={visible ? "passwordHide" : "passwordShow"} />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
