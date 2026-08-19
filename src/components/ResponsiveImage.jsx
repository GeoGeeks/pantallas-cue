export default function ResponsiveImage({
  src,
  srcSet,
  sizes,
  alt,
  width,
  height,
  className,
  loading = "lazy",
  decoding = "async",
  fetchPriority,
  style,
  ...props
}) {
  const ratio = width && height ? `${width} / ${height}` : undefined;

  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      decoding={decoding}
      fetchPriority={fetchPriority}
      className={className}
      style={{
        ...style,
        ...(ratio ? { aspectRatio: ratio } : {}),
      }}
      {...props}
    />
  );
}
