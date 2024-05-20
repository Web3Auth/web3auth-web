/* eslint-disable no-console */
const { JRPCEngine, providerFromEngine, providerAsMiddleware } = require("@toruslabs/openlogin-jrpc");

const ethMiddleware = (req, res, next, end) => {
  console.log("ethMiddleware", req.method);

  if (req.method === "eth_sendTransaction") {
    res.result = "a1";
    end();
  }
};

const aaMiddleware = (req, res, next, end) => {
  console.log("aaMiddleware", req.method);

  if (req.method === "eth_sendTransaction" && req.params[0].from === "a") {
    res.result = "a2";
    end();
  }

  next();
};

const engine = new JRPCEngine();
engine.push(ethMiddleware);

// eth provider
const provider = providerFromEngine(engine);

// aa provider
const engine2 = new JRPCEngine();
engine2.push(aaMiddleware);
engine2.push(providerAsMiddleware(provider));
const provider2 = providerFromEngine(engine2);

provider2
  .request({ method: "eth_sendTransaction", params: [{ from: "n" }] })
  .then((res) => console.log(res))
  .catch((err) => {
    console.error(err);
  });
