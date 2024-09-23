import { Web3AuthProvider } from "@web3auth/modal-react-hooks";
import AppHeader from './components/AppHeader';
import { useAppContext } from './context';
import AppSettings from './components/AppSettings';

function Main() {

  const { web3authContextConfig } = useAppContext();

  return (
    <Web3AuthProvider config={web3authContextConfig}>
      <AppHeader />
      <main className="flex-1 p-1">
        <div className="relative">
          <AppSettings />
        </div>
      </main>       
    </Web3AuthProvider>
  )
}

export default Main
