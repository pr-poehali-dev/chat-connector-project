interface AvatarProps {
  name: string;
  color: string;
  size?: number;
  online?: boolean;
}

export default function Avatar({ name, color, size = 44, online }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <div
        className="rounded-full flex items-center justify-center font-semibold text-white select-none"
        style={{
          width: size,
          height: size,
          background: color,
          fontSize: size * 0.35,
        }}
      >
        {initials}
      </div>
      {online !== undefined && (
        <div
          className="absolute bottom-0 right-0 rounded-full border-2"
          style={{
            width: size * 0.28,
            height: size * 0.28,
            background: online ? "#4CAF50" : "#607d8b",
            borderColor: "#17212b",
          }}
        />
      )}
    </div>
  );
}
