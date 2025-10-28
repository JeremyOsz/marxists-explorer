"use client";

import { CommandInput as CommandInputPrimitive } from "@/components/ui/command";
import { Command as CommandPrimitive } from "@/components/ui/command"; // Import from the ui component
import * as React from "react";

interface ClientCommandInputWrapperProps extends React.ComponentProps<typeof CommandInputPrimitive> {
  commandClassName?: string; // Optional className for the Command component
}

export function ClientCommandInputWrapper({
  commandClassName,
  className,
  ...props
}: ClientCommandInputWrapperProps) {
  return (
    <CommandPrimitive className={commandClassName}>
      <CommandInputPrimitive className={className} {...props} />
    </CommandPrimitive>
  );
}
