import { useContext } from "react";

import { ThemedContext } from "../context/ThemeContext";

export interface ImageProps {
  hoverImageId?: string;
  imageId: string;
  isButton?: boolean;
  height?: string;
  width?: string;
  fallbackImageId?: string;
  extension?: string;
  darkImageId?: string;
  darkHoverImageId?: string;
}
export default function Image(props: ImageProps) {
  const {
    hoverImageId,
    darkHoverImageId,
    imageId,
    darkImageId,
    isButton = false,
    height = "auto",
    width = "auto",
    fallbackImageId,
    extension = "svg",
  } = props;
  const { isDark } = useContext(ThemedContext);

  const imgName = isDark && darkImageId ? darkImageId : imageId;
  const hoverImgName = isDark && darkHoverImageId ? darkHoverImageId : hoverImageId;

  return (
    <>
      <img
        src={`https://images.web3auth.io/${imgName}.${extension}`}
        height={height}
        width={width}
        alt={imageId}
        className="image-icon object-contain rounded"
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
        <img
          src={`https://images.web3auth.io/${hoverImgName}.${extension}`}
          height={height}
          width={width}
          alt={hoverImageId}
          className="hover-icon object-contain rounded"
        />
      ) : null}
    </>
  );
}
