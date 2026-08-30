import type { ImgHTMLAttributes } from "react";

const responsiveWidths = [480, 800, 1200] as const;
const normalizedProductPattern =
  /^\/products\/catalog-normalized\/([^/?]+)\.png$/;

type ProductImageProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "srcSet"
> & {
  src: string;
};

function responsiveProductSource(src: string, format: "avif" | "webp") {
  const match = normalizedProductPattern.exec(src);
  if (!match) return undefined;

  return responsiveWidths
    .map(
      (width) =>
        `/products/catalog-responsive/${match[1]}-${width}.${format} ${width}w`
    )
    .join(", ");
}

export function ProductImage({
  src,
  alt,
  loading = "lazy",
  decoding = "async",
  sizes = "100vw",
  ...imageProps
}: ProductImageProps) {
  const avifSrcSet = responsiveProductSource(src, "avif");
  const webpSrcSet = responsiveProductSource(src, "webp");

  if (!avifSrcSet || !webpSrcSet) {
    return (
      <img
        {...imageProps}
        src={src}
        alt={alt}
        loading={loading}
        decoding={decoding}
      />
    );
  }

  return (
    <picture className="product-picture">
      <source type="image/avif" srcSet={avifSrcSet} sizes={sizes} />
      <source type="image/webp" srcSet={webpSrcSet} sizes={sizes} />
      <img
        {...imageProps}
        src={src}
        alt={alt}
        loading={loading}
        decoding={decoding}
        sizes={sizes}
      />
    </picture>
  );
}
