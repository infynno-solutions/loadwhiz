import { cn } from "@loadwhiz/ui/lib/utils";
import { marketingTextMuted, marketingTextPrimary } from "@/lib/marketing-text";

export function AuthFormHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header className="mb-8 text-center">
      <h1 className={cn("mb-2 font-semibold text-xl", marketingTextPrimary)}>
        {title}
      </h1>
      <p className={cn("text-sm", marketingTextMuted)}>{description}</p>
    </header>
  );
}
