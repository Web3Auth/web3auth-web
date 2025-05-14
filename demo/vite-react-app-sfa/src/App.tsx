import "./App.css";
import styles from "./styles/Home.module.css";
import Main from "./components/Main";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { GOOGLE_CLIENT_ID } from "./config";

function App() {
  return (
    <div className={styles.container}>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <Main />
      </GoogleOAuthProvider>
    </div>
  );
}

export default App;
