import type { NextPage } from "next";

import { useState, useEffect, useContext } from "react";
import { Web3AuthContext } from "../services/web3auth";

const Home: NextPage = () => {
  const { login, provider } = useContext(Web3AuthContext);
  return !provider ? <button onClick={login}>Login</button> : <div>You are logged in</div>;
};

export default Home;
