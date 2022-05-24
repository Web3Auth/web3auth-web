interface ImageProps {
  imageId: string;
  height?: string;
  width?: string;
  cls?: string;
}
export default function Image(props: ImageProps) {
  const { imageId, height = "auto", width = "auto", cls } = props;
  return <img src={`https://images.web3auth.io/${imageId}.svg`} height={height} width={width} alt={imageId} className={cls} />;
}
