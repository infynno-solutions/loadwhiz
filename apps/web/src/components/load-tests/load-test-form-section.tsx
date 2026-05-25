import { Separator } from "@loadwhiz/ui/components/separator";

type LoadTestFormSectionProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  showSeparator?: boolean;
};

export function LoadTestFormSection({
  title,
  description,
  children,
  showSeparator = true,
}: LoadTestFormSectionProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="font-medium text-sm">{title}</h3>
        <p className="mt-0.5 text-muted-foreground text-xs leading-relaxed">
          {description}
        </p>
      </div>
      {children}
      {showSeparator ? <Separator /> : null}
    </div>
  );
}
