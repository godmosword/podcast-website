import Image from "next/image";

type StoryImageProps = {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  priority?: boolean;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  onError?: () => void;
};

export default function StoryImage({
  src,
  alt,
  className,
  style,
  priority = false,
  fill = false,
  width,
  height,
  sizes = "(max-width: 640px) 100vw, 640px",
  onError,
}: StoryImageProps) {
  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className}
        style={style}
        priority={priority}
        sizes={sizes}
        onError={onError}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width ?? 640}
      height={height ?? 480}
      className={className}
      style={style}
      priority={priority}
      sizes={sizes}
      onError={onError}
    />
  );
}
