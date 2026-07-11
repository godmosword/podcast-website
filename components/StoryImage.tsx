import Image from "next/image";
import { getStoryBlurDataUrl } from "@/lib/story-image-blur";

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
  const blurDataURL = getStoryBlurDataUrl(src);
  const placeholder = blurDataURL ? "blur" : undefined;

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
        placeholder={placeholder}
        blurDataURL={blurDataURL}
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
      placeholder={placeholder}
      blurDataURL={blurDataURL}
      onError={onError}
    />
  );
}
