import { useContext, useMemo } from "react";

import { ThemedContext } from "../../context/ThemeContext";
import { ImageProps } from "./Image.type";

/**
 * Image component
 * @param props - ImageProps
 * @returns Image component
 */
export default function Image(props: ImageProps) {
  const {
    id = "",
    isButton = false,
    height = "auto",
    width = "auto",
    extension = "svg",
    darkImageId = "",
    darkHoverImageId = "",
    imageId,
    hoverImageId,
    fallbackImageId,
    imgClass,
  } = props;

  const { isDark } = useContext(ThemedContext);

  const imgName = useMemo(() => (isDark && darkImageId ? darkImageId : imageId), [isDark, darkImageId, imageId]);
  const hoverImgName = useMemo(() => (isDark && darkHoverImageId ? darkHoverImageId : hoverImageId), [isDark, darkHoverImageId, hoverImageId]);

  if (isButton) {
    return (
      <img
        id={id}
        src={`https://images.web3auth.io/${hoverImgName}.${extension}`}
        height={height}
        width={width}
        alt={hoverImageId}
        className={`w3a--rounded w3a--object-contain ${imgClass}`}
      />
    );
  }

  return (
    <img
      id={id}
      src={`https://images.web3auth.io/${imgName}.${extension}`}
      height={height}
      width={width}
      alt={imageId}
      className={`w3a--rounded w3a--object-contain ${imgClass}`}
      onError={({ currentTarget }) => {
        if (fallbackImageId) {
          const img = currentTarget;
          img.onerror = null; // prevents looping
          img.src = `https://images.web3auth.io/${fallbackImageId}.svg`;
        }
      }}
    />
  );
}
