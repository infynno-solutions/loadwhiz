type SettingsPageHeaderProps = {
  title: string;
  description: string;
};

export function SettingsPageHeader({
  title,
  description,
}: SettingsPageHeaderProps) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="font-semibold text-2xl tracking-tight">{title}</h1>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}
