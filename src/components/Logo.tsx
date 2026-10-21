import Image from "next/image";

export default function Logo({ height = 28 }: { height?: number }) {
  // Source is 900x270 (3.33:1), so width scales to match the requested height.
  const width = Math.round(height * (900 / 270));

  return (
    <Image
      src="/sona-logo.png"
      alt="Sona Gold & Diamonds"
      width={width}
      height={height}
      priority
      className="h-auto"
      style={{ height, width: "auto" }}
    />
  );
}
