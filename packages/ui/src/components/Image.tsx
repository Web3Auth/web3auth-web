interface ImageProps {
  hoverImageId?: string;
  imageId: string;
  height?: string;
  width?: string;
}
export default function Image(props: ImageProps) {
  const { hoverImageId, imageId, height = "auto", width = "auto" } = props;
  return (
    <>
      <img src={`https://images.web3auth.io/${imageId}.svg`} height={height} width={width} alt={imageId} className="image-icon" />
      <img src={`https://images.web3auth.io/${hoverImageId}.svg`} height={height} width={28} alt={imageId} className="hover-icon" />
    </>
  );
}
