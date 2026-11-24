declare module "*.module.css";
declare module "*.css";
declare module "*.svg";

declare module "postcss-prefix-selector" {
  interface PrefixSelectorOptions {
    prefix: string;
    transform?: (prefix: string, selector: string, prefixedSelector: string) => string;
  }
  export default function prefixSelector(options: PrefixSelectorOptions): unknown;
}
