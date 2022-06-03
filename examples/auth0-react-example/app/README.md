# Web3Auth X Auth0(Passwordless) Demo
## Auth0 Prerequisites:-

- Create a Auth0 project/tenant and configure a single page web app from [Auth0 Console](https://manage.auth0.com/).

- Whitelist the redirect urls while configuring Auth0 SPA(Single Page Application). E.g:  https://beta.openlogin.com/auth

- You will require domain and clientId of newly created SPA which you can copy from [Auth0 Console](https://manage.auth0.com/).


## Web3Auth Pre-requisites

- Create a project from plug and play section of [web3auth developer dashboard](https://dashboard.web3auth.io) and
copy your clientId to env variable named `REACT_APP_CLIENT_ID` in env.development file.

- Create a custom verifier from [web3auth developer dashboard](https://dashboard.web3auth.io) with following configuration:

- Select verifier type as `Auth0`, clientId and domain from `newly created Auth0 SPA`.  

- Add your verifier name as a env variable named `REACT_APP_VERIFIER` in env.development file.


- To know how above configuration is being used in this example repo, refer to `init()` and `login()` functions in `src/services/web3auth.tsx` file


## How it works?

- While using Auth0 or any auth service provider, Web3Auth requires two things to validate user's jwt token:-

    - A Valid Jwt token issued by auth service provider.
    - Information about how to validate the JWT token in torus key management network.

- On successful login with Auth0, it returns a jwt token. This jwt token is sent to Web3Auth sdk's login function.

- Information about validating JWT token is already added while creating a custom verifier from [web3auth developer dashboard](https://dashboard.web3auth.io). So we just need to specify our verifier name while adding Openlogin Adapter to web3auth. Refer to `init()` function in `src/services/web3auth.tsx` file.

## For RWA example you need to load it from .env file :
1. Your domain name in loginRWA method
2. Your server endpoint for login button
## Installation

config:
```bash
Copy .env.developement to .env(if not present create new file) and change configuration of app accordingly using .env file.
```

Run:

```bash
npm install
```

## Start

Run:

```bash
npm run start
```
