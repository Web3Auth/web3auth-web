/* eslint-disable import/no-extraneous-dependencies */
import dotenv from "dotenv";
import jwt, { Algorithm } from "jsonwebtoken";

dotenv.config({ path: `.env` });
const jwtPrivateKey = `-----BEGIN PRIVATE KEY-----\n${process.env.JWT_PRIVATE_KEY}\n-----END PRIVATE KEY-----`;
export const generateIdToken = (email: string, alg: Algorithm) => {
  const iat = Math.floor(Date.now() / 1000);
  const payload = {
    iss: "torus-key-test",
    aud: "torus-key-test",
    name: email,
    email,
    scope: "email",
    iat,
    eat: iat + 120,
  };

  const algo = {
    expiresIn: 120,
    algorithm: alg,
  };

  return jwt.sign(payload, jwtPrivateKey, algo);
};
