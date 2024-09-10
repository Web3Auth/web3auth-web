export interface ImageProps {
  hoverImageId?: string;
  imageId: string;
  isButton?: boolean;
  height?: string;
  width?: string;
  fallbackImageId?: string;
}
export default function Image(props: ImageProps) {
  const { hoverImageId, imageId, isButton = false, height = "auto", width = "auto", fallbackImageId } = props;
  return (
    <>
      <img
        src={`https://images.web3auth.io/${imageId}.svg`}
        height={height}
        width={width}
        alt={imageId}
        className="image-icon"
        onError={({ currentTarget }) => {
          if (fallbackImageId) {
            // eslint-disable-next-line no-param-reassign
            currentTarget.onerror = null; // prevents looping
            // eslint-disable-next-line no-param-reassign
            currentTarget.src = `https://images.web3auth.io/${fallbackImageId}.svg`;
          }
        }}
      />
      {isButton ? (
        <img src={`https://images.web3auth.io/${hoverImageId}.svg`} height={height} width={width} alt={hoverImageId} className="hover-icon" />
      ) : null}
    </>
  );
}
