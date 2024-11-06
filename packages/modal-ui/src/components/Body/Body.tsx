import { createSignal } from "solid-js";
import Footer from "../Footer/Footer";
import ConnectWallet from "./ConnectWallet";
import Login from "./Login";

const PAGES = {
  LOGIN: 'login',
  CONNECT_WALLET: 'connect_wallet'
}

const Body = () => {

  const [currentPage, setCurrentPage] = createSignal(PAGES.LOGIN);


  return (
    <div class="h-[760px] p-6 flex flex-col flex-1">
      {currentPage() === PAGES.LOGIN && <Login onExternalWalletClick={() => setCurrentPage(PAGES.CONNECT_WALLET)} />}
      {currentPage() === PAGES.CONNECT_WALLET && <ConnectWallet onBackClick={() => setCurrentPage(PAGES.LOGIN)} />}
      <Footer />
    </div>
  );
};

export default Body