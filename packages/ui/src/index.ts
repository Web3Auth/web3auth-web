// import { UI } from "./ui";

// const w3aUI = new UI({
//   appLogo: "https://cryptologos.cc/logos/solana-sol-logo.svg",
//   version: "V 1.12.3",
// });

// w3aUI.init();

// w3aUI.addSocialLogins({
//   google: {
//     visible: true,
//     showOnMobile: true,
//     showOnDesktop: true,
//   },
// });

// w3aUI.addSocialLogins({
//   facebook: {
//     visible: true,
//     showOnMobile: true,
//     showOnDesktop: true,
//   },
// });

// w3aUI.addWalletLogins({
//   phantom: {
//     visible: true,
//     showOnMobile: true,
//     showOnDesktop: true,
//   },
// });

// w3aUI.on("login", (provider: string, loginHint?: string) => {
//   // eslint-disable-next-line no-console
//   console.log("login", provider, loginHint);
// });

export * from "./ui";
