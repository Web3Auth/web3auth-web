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
    imageData = "",
    height = "auto",
    width = "auto",
    extension = "svg",
    darkImageId = "",
    darkHoverImageId = "",
    imageId,
    hoverImageId,
    fallbackImageId,
  } = props;

  const { isDark } = useContext(ThemedContext);

  const imgName = useMemo(() => (isDark && darkImageId ? darkImageId : imageId), [isDark, darkImageId, imageId]);
  const hoverImgName = useMemo(() => (isDark && darkHoverImageId ? darkHoverImageId : hoverImageId), [isDark, darkHoverImageId, hoverImageId]);

  if (isButton) {
    if (imageData) {
      return <img id={id} src={imageData} height={height} width={width} alt={hoverImageId} className="w3a--object-contain" />;
    }
    return (
      <img
        id={id}
        src={`https://images.web3auth.io/${hoverImgName}.${extension}`}
        height={height}
        width={width}
        alt={hoverImageId}
        className="w3a--rounded w3a--object-contain"
      />
    );
  }

  if (imageData) {
    return (
      <img
        id={id}
        src={imageData}
        height={height}
        width={width}
        alt={imageId}
        className="w3a--object-contain"
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

  return (
    <img
      id={id}
      src={`https://images.web3auth.io/${imgName}.${extension}`}
      height={height}
      width={width}
      alt={imageId}
      className="w3a--rounded w3a--object-contain"
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
