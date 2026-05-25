import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@loadwhiz/ui/components/input-group";
import { cn } from "@loadwhiz/ui/lib/utils";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import * as React from "react";

function InputPassword({
  className,
  ...props
}: React.ComponentProps<typeof InputGroupInput>) {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <InputGroup className={cn("w-full", className)}>
      <InputGroupInput type={showPassword ? "text" : "password"} {...props} />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={showPassword ? "Hide password" : "Show password"}
          onClick={() => setShowPassword((value) => !value)}
        >
          {showPassword ? <EyeOffIcon /> : <EyeIcon />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}

export { InputPassword };
