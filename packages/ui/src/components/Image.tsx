import React from "react";

interface ImageProps {
  imageId: string;
}
export default function Image(props: ImageProps) {
  const { imageId } = props;
  return <img src={`https://images.web3auth.io/${imageId}.svg`} />;
}
