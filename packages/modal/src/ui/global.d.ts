declare module "*.module.css";
declare module "*.svg" {
  const content: string;
  export default content;
}

declare module "@mertasan/tailwindcss-variables";
