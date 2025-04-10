import { useContext, useMemo } from "react";

import { ThemedContext } from "../../context/ThemeContext";
import { cn } from "../../utils";
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
      return (
        <img
          id={id}
          src={imageData}
          height={height}
          width={width}
          alt={hoverImageId}
          className={cn("w3a--object-contain", `w3a--h-${height} w3a--w-${width}`)}
        />
      );
    }
    return (
      <img
        id={id}
        src={`https://images.web3auth.io/${hoverImgName}.${extension}`}
        height={height}
        width={width}
        alt={hoverImageId}
        className={cn("w3a--rounded w3a--object-contain", `w3a--h-${height} w3a--w-${width}`)}
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
        className={cn("w3a--object-contain", `w3a--h-${height} w3a--w-${width}`)}
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
      className={cn("w3a--rounded w3a--object-contain", `w3a--h-${height} w3a--w-${width}`)}
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
