# Web3Auth X AWS Cognito Demo

# Cognito Configuration involves 3 steps:
1. Configuring user pool and creating app client in AWS Cognito.[ref](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pool-as-user-directory.html)
2. Configuring any identity provider with AWS Cognito, in this demo we configured google identity/login provider.[ref](https://aws.amazon.com/premiumsupport/knowledge-center/cognito-google-social-identity-provider/)
3. Configure AWS Cognito app with Web3Auth.

You can take inspiration from [here](https://docs.tor.us/guides/customAuth-aws-cognito).

## Configuring Cognito user pool in aws cognito:-

- Go to your aws account and open aws cognito service. And Create a new user pool by following this aws guide:
`https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pool-as-user-directory.html`

- Note down your `user pool id` and `region` after creating new pool.

- Add a new app client to the user pool from `App clients` tab under your pool settings.

- Note down the `clientId` for this app client.

- Add a domain to your aws cognito app from `App integration's domain name section`

- Update app client settings for the new app client under `App client settings` tab to set desired oauth flows and redirect endpoints.



## Configuring google login/identity provider in AWS Cognito

- Go to identity providers tab under federation tab and select google. It will require you to enter your google's app client id and secret which you can obtain [here](https://console.cloud.google.com/apis/dashboard).
NOTE: For creating google's app client id you need to select any one service from available services [Guide](https://aws.amazon.com/premiumsupport/knowledge-center/cognito-google-social-identity-provider/)

- While configuring your google app oauth client for web, make sure to enter your `cognito domain` in the `Authorized Javascript Origins list` and `<AWS_COGNITO_DOMAIN>/oauth2/idpresponse` end point in the `Authorized redirect URIs list`.

- Go back to your aws console and enter your google app client id and secret key.

- Your google login provider is configured, you can enable it in your App client settings in aws console.

- Now lets move to configure Web3Auth and AWS Cognito app.

## Configure AWS Cognito app with Web3Auth

- Create a project from plug and play section of [web3auth developer dashboard](https://dashboard.web3auth.io) and
copy your clientId to env variable named `REACT_APP_CLIENT_ID` in env.development file.

- Do the following steps in order to create your custom verifier:-

- Login in to developer dashboard, go to Custom Auth tab.

- Click on create verifier button.

- Enter your custom verifier information as follows:-

    1. Enter your unique verifier identifier, it will represent your application on torus network. You will need to use this value later while initializing your sdk.

    2. Select network option:-

    - `Testnet`:- Select testnet for development mode. Your verifier will be deployed on ropsten testnet and torus test network.
    - `Mainnet`:- Select mainnet for production mode. Your verifier will be deployed on ethereum mainnet and torus main network.

    3. Select Verifier type as: `Custom`

    4. `Enter JWT Verifier ID` as : "email". You can also use `sub` as your jwt verifier id but if you are using multiple login providers then your users will get diffrent private keys accross diffrent login providers even if they use same email address as they will be assigned different ids by aws cognito. You can set this field based on your application needs provided that it should be a unique identifier for user.

    5. Your JWK endpoint endpoint for aws cognito will look like this - `https://cognito-idp.{region}.amazonaws.com/{userPoolId}/.well-known/jwks.json` , get values of `region` and `userPoolId` from your `aws cognito console`.

    6. Enter JWT validation fields:-

        -`iss`: It should be `https://cognito-idp.{region}.amazonaws.com/{userPoolId}`, replace `region` and `userPoolId`  that we noted earlier while creating cognito user pool.

        -`aud`: It should be your client id that your noted earlier while creating app client in aws cognito console.

    7. Save you verifier and it will be deployed in 5-10 minutes.

- To know how above configuration is being used in this example repo, refer to `init()` and `login()` functions in `src/services/web3auth.tsx` file


## How it works?

- While using Cognito or any auth service provider, Web3Auth requires two things to validate user's jwt token:-

    - A Valid Jwt token issued by auth service provider.
    - Information about how to validate the JWT token in torus key management network.

- On successful login with Cognito, it returns a jwt token. This jwt token is sent to Web3Auth sdk's login function.

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
