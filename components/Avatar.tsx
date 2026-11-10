import { AVATAR_PRESETS } from "@/lib/avatars";

export function Avatar({
  value,
  name,
  size = 45,
}: {
  value: string;
  name?: string;
  size?: number;
}) {
  const style = { width: size, height: size };

  // Uploaded avatar (data URL)
  if (value?.startsWith("data:")) {
    return (
      <img
        src={value}
        alt={name ?? "avatar"}
        style={style}
        className="rounded-full object-cover ring-2 ring-line overflow-hidden flex items-center justify-center"
      />
    );
  }

  const preset =
    AVATAR_PRESETS.find((p) => `preset:${p.id}` === value) ?? AVATAR_PRESETS[0];

  return (
    <img
      src={preset.image}
      alt={name ?? "avatar"}
      style={style}
      className="rounded-full ring-2 ring-line object-cover"
    />
  );
}
