# Web3Auth X Firebase Demo
## Firebase Prerequisites:-

- Create a firebase project and configure a web app from [Firebase Console](https://firebase.google.com/console/).

- Install firebase sdk: `npm install --save firebase`

- Copy your web app's firebase config from firebase console and paster in `src/firebaseConfig.ts` file.

- Enable the Auth providers you would like to offer your users in the firebase console, under
  Auth > Sign-in methods.


## Web3Auth Pre-requisites

- Create a project from plug and play section of [web3auth developer dashboard](https://dashboard.web3auth.io) and
copy your clientId to env variable named `REACT_APP_CLIENT_ID` in env.development file.

- Create a custom verifier from [web3auth developer dashboard](https://dashboard.web3auth.io) with following configuration:

- Use `sub` as `JWT Verifier ID` field in custom verifier window. JWT verifier id field will uniquely identify user. User wallets will be mapped to this field.

- Use `https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com` as JWK Endpoint in custom verifier window

 - Make sure to add a following JWT validation fields in custom verifier window ([here](https://firebase.google.com/docs/auth/admin/verify-id-tokens#retrieve_id_tokens_on_clients) is a related, helpful Firebase doc):-

    - `aud`: firebase project id.
    - `iss`: `https://securetoken.google.com/<firebase-project-id>`

- Add your verifier name as a env variable named `REACT_APP_VERIFIER` in env.development file.


- To know how above configuration is being used in this example repo, refer to `init()` and `login()` functions in `src/services/web3auth.tsx` file


- Your custom verifer configuration should look like the config given in the image below:-

- <img src="https://i.ibb.co/1Jrzph5/Screenshot-2022-03-10-at-1-46-03-AM.png"/>


## How it works?

- While using firebase or any auth service provider, Web3Auth requires two things to validate user's jwt token:-

    - A Valid Jwt token issued by auth service provider.
    - Information about how to validate the JWT token in torus key management network.

- On successful login with firebase, firebase returns a jwt token. This jwt token is sent to Web3Auth sdk's login function.

- Information about validating JWT token is already added while creating a custom verifier from [web3auth developer dashboard](https://dashboard.web3auth.io). So we just need to specify our verifier name while adding Openlogin Adapter to web3auth. Refer to `init()` function in `src/services/web3auth.tsx` file.

## Installation

Run:

```bash
npm install
```

## Start

Run:

```bash
npm run start
```
