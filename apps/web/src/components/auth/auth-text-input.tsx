import { Input } from "@loadwhiz/ui/components/input";
import { cn } from "@loadwhiz/ui/lib/utils";
import type * as React from "react";

import {
  authInputInnerClass,
  authInputShellClass,
} from "@/components/auth/auth-styles";

/** Text/email field with the same bordered shell as InputPassword */
export function AuthTextInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <div className={authInputShellClass}>
      <Input className={cn(authInputInnerClass, className)} {...props} />
    </div>
  );
}
