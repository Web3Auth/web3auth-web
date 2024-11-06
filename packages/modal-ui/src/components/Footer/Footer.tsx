const Footer = () => {
  return (
    <div class="flex items-center gap-2 justify-center pt-6 mt-auto">
      <div class="text-xs text-app-gray-300 dark:text-app-gray-500">{"modal.footer.message-new"}</div>
      <img
        height="16"
        src="https://images.web3auth.io/web3auth-footer-logo-light.svg"
        alt="Web3Auth Logo Light"
        class="h-4 block dark:hidden"
      />
      <img
        height="16"
        src="https://images.web3auth.io/web3auth-footer-logo-dark.svg"
        alt="Web3Auth Logo Dark"
        class="h-4 hidden dark:block"
      />
    </div>
  )
}

export default Footer