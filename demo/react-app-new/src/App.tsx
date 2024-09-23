import './index.css'
import { AppProvider } from './context';
import Main from './MainView';


function App() {

  return (
    <AppProvider>
      <Main/>
    </AppProvider>

  )
}

export default App
