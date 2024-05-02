# Tokenizer

This application is to participate in the Scrypto Challenge about Yield Derivaties

This dApp is composed by:
    - blueprint
    - frontend 
    - transaction manifest files
    - bash script for testing
    - unit test

The blueprint has been already deployed and it is possible to test it right away just by running the included frontend

This dApp allows users to provide liquidity and it is configured to initially handle only two types of resource addresses, 
by the way additional token address can be provided.

This dApp defines a variable reward percentage over time and it is the administrator's responsibility to change this percentage.

Each account that provides liquidity will be rewarded according to the percentages in effect during the periods,
and he will receive his reward when he withdraws his liquidity.

![Supply](supply.png)  

Each account can also execute a liquidity freeze operation, specifying the duration for which the account wants to block the liquidity.

This liquidity block is called tokenizing, and it guarantees the account an additional reward calculated at the time the block is executed at the  percentage in force at that moment.
Then, liquidity release can be performed after the specified date 

Before expiry it is possible to trade the principal token on the market because this token will change in value depending on the changes in the percentages in force.

This means that if after the liquidity freeze the interest rate in force increases or decreases then the value of the principality will also change

And this opens up the possibility of carrying out buying and selling operations by those who think how the price will move subsequently

![Tokenize](tokenize.png)  

# Tokenizer Implementation

This blueprint can handle different multiple tokens, there are two that need to be defined at the beginning, and later the administrator can add new address resources.

This tokens are managed through a data structure like this 'collected: HashMap<ResourceAddress, FungibleVault>'.

Each account that provides liquidity is rewarded with a calculated at the moment the liquidity is withdrawn but an important detail is that the rewards are variable over time, 
this means that it was necessary to memorize the changes in rewards over the epochs and that this has been done through a AVL-Tree data structure so that interest calculation can be done efficiently.

The data structure is defined as here 'interest_for_suppliers: AvlTree<Decimal, Decimal>'

Every time the reward changes it is memorized in which epoch this has occurred.

Each time an account withdraws the provided liquidity the calculation is performed using all the intervals within which the liquidity was provided

This means that the provision of liquidity is subject to a variable interest over time but what you can do is lock in the interest for a duration of time through the 'tokenize'.

After this operation the account can wait for the end of the locking period, otherwise you can execute a swap which will be rewarded with a higher or lower price than the current interest rate.

This swap can be performed both on this platform and also on other platforms, because both the fungible token and the non-fungible token can be withdrawed by the account.

Every account that will interact with this dApp will receive a NFT containing both the liquidity data and the tokenized data.

The data structure is defined as here

    'liquidity_position: HashMap<ResourceAddress, LiquidityData>'
    
    'yield_token_data: HashMap<ResourceAddress, YieldTokenData>'

# Interacting with our Tokenizer Locally

If you want you can interact with the Tokenizer in your local environment by using resim

You have to use `resim` with some of the most used command like `resim reset`,`resim new-account`,`resim run rtm/instantiate_tokenizer.rtm` and so on

You can have a look at the bash script scrypto/tokenize.sh that executes all the functions available 

## Administration 

As the holder of the admin or owner badge you can run `resim run rtm/set_reward.rtm` to set the reward for suppliers.
`resim call-method ${component} set_reward 10 --manifest rtm/set_reward.rtm`

As the holder of the admin,owner you can run `resim run rtm/extend_lending_pool.rtm` to extend the pool for suppliers.
`resim call-method ${component} extend_lending_pool 100 --manifest rtm/extend_lending_pool.rtm`

As the holder of the admin,owner you can run `resim run rtm/add_token.rtm` to add a new token to the dApp.
`resim call-method ${component} add_token resource_address --manifest rtm/add_token.rtm`

## Staff

As a staff member you can config the dApp, changing the reward for suppliers, the min and max limit and so on.

Staff member can be assigned by an administator a recallable staff badge to execute functions over the dApp.

# Building & Testing

## Package building

You can run `scrypto build` from the `scrypto` directory for building the packages for deploy

## Quick test

From the directory `scrypto` you can run:

    - ./tokenizer.sh for testing some of the main function, but mainly the part of tokenizing

    - ./supply.sh for testing some of the main function, but mainly the part of supply

    - ./swap.sh for testing some of the main function, but mainly the part of swapping before maturity

    This contains an example of the result of two swap operation:
        The first ended in a gain because interest rates dropped, the second ended in a loss because interest rose

## Unit test

You can run `scrypto test` from the `scrypto` directory for testing the main functions

# Let's have a look at the dApp 

Some shortcut are available for testing, deploying and managing the dApp

You can run the following to deploy on Stokenet:

     - `npm install` to install all the packages

     - `npm run` to look for all the available command

     - `scrypto build` to build the WASM

     - Fill your seed phrase in the `.env` file in the main directory in key `MNEMONIC`

     - `npm run tokenizer:deploy-tokenizer` to deploy the package to stokenet (a new file `entities.properties` will be written with the new component and resource addresses created)

You can then run the frontend application:
     - move to the `client` directory

     - `npm install` to install all the packages

     - fill the variables from the file `entities.properties` to the file `env.staging`
     
     - `npm run` to look for all the available command

     - `npm run dev` to run the application and then browse to `localhost:5173`

You can also admin the dApp

    - point your browser to `localhost:5173/admin.html` 

    - config the dApp with your Owner or Admin Badge

# Online demo dApp 

You can also try the deployed dApp here https://zerocollateral.eu/


## To change the ENV for the frontend dApp

You can also try the dApp using the component and resource addresses created by resim.
To do that you have to fill those values in the file `env.staging` and change the environment as described below

Most important is package.json

    "dev": "cross-env NODE_ENV=staging vite",
    "build": "cross-env NODE_ENV=staging vite build",

Then you need to execute 'npm run build' and then 'npm run dev'

Also you need to change this value in vite.config.js

staging will resolve to env.staging
local will resolve to env.local

    define: {
      'process.env.NODE_ENV': JSON.stringify('staging')
    }

# TODO

You can also try the deployed dApp here https://zerocollateral.eu/
