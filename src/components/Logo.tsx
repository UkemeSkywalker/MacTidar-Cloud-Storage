import Image from "next/image";

// Full MacTidar Cloud logo (mark + wordmark). Files in public/brand are already sized.
export function Logo({ height = 40 }: { height?: number }) {
  return <Image src="/brand/logo.png" alt="MacTidar Cloud" width={Math.round((height * 537) / 160)} height={height} unoptimized priority />;
}

// Just the cloud mark, for small spots next to text.
export function LogoMark({ height = 18 }: { height?: number }) {
  return <Image src="/brand/mark.png" alt="" width={Math.round((height * 205) / 128)} height={height} unoptimized />;
}
