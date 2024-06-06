import { RadixDappToolkit, DataRequestBuilder, RadixNetwork, createLogger, NonFungibleIdType } from '@radixdlt/radix-dapp-toolkit'
import { it } from 'node:test';

const environment = process.env.NODE_ENV || 'Stokenet'; // Default to 'development' if NODE_ENV is not set
console.log("environment (gateway.js): ", environment)
// Define constants based on the environment
let dAppId, networkId, gwUrl: string, dashboardUrl: string;

if (environment == 'production') {
  dAppId = import.meta.env.VITE_DAPP_ID
  networkId = RadixNetwork.Mainnet;
} else {
  // Default to Stokenet configuration
  dAppId = import.meta.env.VITE_DAPP_ID
  networkId = RadixNetwork.Stokenet;
}
gwUrl = import.meta.env.VITE_GATEWAY_URL;
dashboardUrl = import.meta.env.VITE_DASHBOARD_URL;
let component = import.meta.env.VITE_COMP_ADDRESS;
let userdata_nft = import.meta.env.VITE_USERDATA_NFT_RESOURCE_ADDRESS;
console.log("gw url (gateway.js): ", gwUrl)
console.log("dashboard url (gateway.js): ", dashboardUrl)
console.log("component address (gateway.js): ", component)

/**
 * Instantiate Radix Dapp Toolkit (RDT).
 * 
 */
export const rdt = RadixDappToolkit({
  dAppDefinitionAddress: dAppId,
  networkId: networkId,
  logger: createLogger(1),
  applicationName: 'Tokenizer',
  applicationVersion: '1.0.0'
  ,onDisconnect: () => {
    // clear your application state
    localStorage.removeItem('accountAddress')
  }
});

// Global states
let componentAddress = import.meta.env.VITE_COMP_ADDRESS //Component address on stokenet

/**
 * Manage multi tokens by returning the token address based on the currency.
 */
export function getTokenAddress(currency) {
    if (currency === 'XRD') {
        return 'resource_tdx_2_1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxtfd2jc';
    } else if (currency === 'USDC') {
        return 'resource_tdx_2_1t5e5q2jsn9eqe5ma0gqtpfjzqcmchjze28rfyttzunu3pr6y6t06t7';
    } else if (currency === 'HUG') {
      return 'resource_tdx_2_1tkna28k99gnj24ngqxvrcl7dh7lrqyr85496guk2zgprjhg8nkvs5h';
    }  else if (currency === 'xWBTC') {
      return 'resource_tdx_2_1t48fsfmh9kdfhdvge8x5dxee7u38wqcrjwesghjlks8lzmst725ccg';
    }  else if (currency === 'xETH') {
      return 'resource_tdx_2_1tkjmydgvva5rl8x0lt9vn5lzpz2xh2d23klzjhv884hm9gg770l720';
    }

    
  
    // Return a default value or handle other cases as needed
    return '';
}

let accountAddress: string | null;

// ************ Fetch the user's account address (Page Load) ************
rdt.walletApi.setRequestData(DataRequestBuilder.accounts().atLeast(1))

// Subscribe to updates to the user's shared wallet data
const subscription = rdt.walletApi.walletData$.subscribe((walletData) => {
  accountAddress = walletData && walletData.accounts && walletData.accounts.length>0 ? walletData.accounts[0].address : null
  console.log("accountAddress : ", accountAddress)
  if (accountAddress!=null) {
    
    const element = document?.getElementById('accountAddress') as HTMLInputElement | null;
    if (element) {
        element.value = accountAddress ?? '';
    }

    // Store the accountAddress in localStorage
    localStorage.setItem('accountAddress', accountAddress);


    interface Hashmap {
      [key: string]: any;
    }    
    const hashmap: Hashmap = fetchComponentConfig(componentAddress)  
    //get config parameter of the component
    console.log("Hashmap:", hashmap);  
  
    //fetch nft metadata info of the connected user
    fetchUserPosition(accountAddress);
  }


})



// *********** Fetch Component Config (/state/entity/details) (Gateway) ***********
interface Hashmap {
  [key: string]: any;
}    
export async function fetchComponentConfig(_componentAddress: any): Promise<Hashmap>  {
  // Define the data to be sent in the POST request.
  const requestData = generatePayload("ComponentConfig", "", "Global");
  const hashmap: Hashmap = {};
  // Make an HTTP POST request to the gateway
  fetch(gwUrl+'/state/entity/details', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: requestData,
  })
  .then(response => response.json()) // Assuming the response is JSON data.
  .then(data => { 
    const json = data.items ? data.items[0] : null;
    
    const currentEpoch = data.ledger_state.epoch;

    const rewardValue = getReward(json);
    const extrarewardValue = getExtraReward(json);

    const currentRewardConfig = document.getElementById("currentReward");
    const currentExtraRewardConfig = document.getElementById("currentExtraReward");

    if (currentRewardConfig) currentRewardConfig.textContent = rewardValue + '%' ?? '';
    if (currentExtraRewardConfig) currentExtraRewardConfig.textContent = extrarewardValue + '%' ?? '';

  })
  .catch(error => {
      console.error('Error fetching data:', error);
  });
  return hashmap;
}



// ************ Utility Function (Gateway) *****************
function generatePayload(method: string, _address: string, resource_address: string) {
  let code;
  //console.log("generatePayload for method:", method);
  switch (method) {
    case 'ComponentConfig':
      console.log("generatePayload for method:", method);
      code = `{
        "addresses": [
          "${componentAddress}"
        ],
        "aggregation_level": "Global",
        "opt_ins": {
          "ancestor_identities": true,
          "component_royalty_vault_balance": true,
          "package_royalty_vault_balance": true,
          "non_fungible_include_nfids": true,
          "explicit_metadata": [
            "name",
            "description"
          ]
        }
      }`;
    break;   
    case 'UserPosition':
      console.log("generatePayload for method:", method);
      code = `{
        "addresses": [
          "${accountAddress}"
        ],
        "aggregation_level": "Vault",
        "opt_ins": {
          "ancestor_identities": true,
          "component_royalty_vault_balance": true,
          "package_royalty_vault_balance": true,
          "non_fungible_include_nfids": true,
          "explicit_metadata": [
            "name",
            "description"
          ]
        }
      }`;
    break;       
    // Add more cases as needed
    default:
      throw new Error(`Unsupported method: ${method}`);
  }
  return code;
}

// ************ Utility Function (Gateway) *****************
function getReward(data: { details: { state: { fields: any[]; }; }; }) {
  const rewardField = data.details.state.fields.find((field: { field_name: string; }) => field.field_name === "reward");
  return rewardField ? rewardField.value : null;
}

function getExtraReward(data: { details: { state: { fields: any[]; }; }; }) {
  const rewardField = data.details.state.fields.find((field: { field_name: string; }) => field.field_name === "extra_reward");
  return rewardField ? rewardField.value : null;
}





// *********** Fetch User NFT Metadata Information (/entity/details) (Gateway) ***********
export async function fetchUserPosition(_accountAddress: string) {
  // Define the data to be sent in the POST request.
  const requestData = generatePayload("UserPosition", "", "Vault");
  console.log("requestDat for entity/details:", requestData);

  // Make an HTTP POST request to the gateway
  fetch(gwUrl+'/state/entity/details', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: requestData,
  })
  .then(response => response.json()) // Assuming the response is JSON data.
  .then(data => { 
      const resourceAddress = `${userdata_nft}`;
      const result = getVaultsByResourceAddress(data, resourceAddress);
      console.log(" NFT id " + JSON.stringify(result));
      //TODO controllare la presenza di items
      const itemsArray = result && result.length>0 ? result[0].items : null
      console.log(" itemsArray " + itemsArray);
      // Loop through itemsArray and make GET requests for each item
      itemsArray?.forEach(async (item: any) => {
        await fetchNftMetadata(resourceAddress, item);
      });
  })
  .catch(error => {
      console.error('Error fetching data:', error);
  });
}



// *********** Fetch User NFT Metadata Information (Filtering response) (Gateway Utility) ***********
function getVaultsByResourceAddress(jsonData: { items: never[]; }, resourceAddress: string) {
  const items = jsonData.items || [];
  // Filter items based on the resource_address
  const filteredItems = items.filter((item: { non_fungible_resources: { items: any[]; }; }) => {
    return (
      item.non_fungible_resources &&
      item.non_fungible_resources.items &&
      item.non_fungible_resources.items.length > 0 &&
      item.non_fungible_resources.items.some(
        (        resource: { resource_address: any; }) =>
          resource.resource_address &&
          resource.resource_address === resourceAddress
      )
    );
  });

  // Extract vaults from the filtered items
  const vaults = filteredItems.reduce((result: any[], item: { non_fungible_resources: { items: any[]; }; }) => {
    if (
      item.non_fungible_resources &&
      item.non_fungible_resources.items &&
      item.non_fungible_resources.items.length > 0
    ) {
      const matchingResources = item.non_fungible_resources.items.filter(
        (        resource: { resource_address: any; }) =>
          resource.resource_address &&
          resource.resource_address === resourceAddress
      );
      
      matchingResources.forEach((resource: { vaults: { total_count: number; items: any; }; }) => {
        if (resource.vaults && resource.vaults.total_count > 0) {
          result.push(...resource.vaults.items);
        }
      });
    }
    return result;
  }, []);

  return vaults;
}





// *********** Fetch User NFT Metadata Information (/non-fungible/data) (Gateway Utility) ***********
async function fetchNftMetadata(resourceAddress: string, item: any) {
  // Define the data to be sent in the GET request.
  const requestData = `{
    "resource_address": "${resourceAddress}",
    "non_fungible_ids": [
      "${item}"
    ]
  }`;

  // Make an HTTP POST request to the gateway
  fetch(gwUrl+'/state/non-fungible/data', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: requestData,
  })
  .then(response => response.json()) 
  .then(data => { 
    console.info('UserPosition complete data:', JSON.stringify(data, null, 2));
    // Extracting values from the nested structure
    const extractedValues: { field_name: any; value: any; }[] = [];

    // data.non_fungible_ids.forEach((id: { data: { programmatic_json: { fields: any[]; }; }; }) => {
    //   id.data.programmatic_json.fields.forEach((field: { field_name: any; value: any; }) => {
    //     const { field_name, value } = field;
    //     extractedValues.push({ field_name, value });
    //   });
    // });

    data.non_fungible_ids.forEach((id: { data: { programmatic_json: { fields: any[]; }; }; }) => {
      id.data.programmatic_json.fields.forEach((field: { field_name: any; value: any; }) => {
        const { field_name, value } = field;
        console.info('UserPosition checking :', field_name, value );
          // If it's not a tuple, just push the field as is
          extractedValues.push({ field_name, value });
      });
    });
    console.info('UserPosition what does it contains:', extractedValues);

    data.non_fungible_ids.forEach((id: { data: { programmatic_json: { fields: any[]; }; }; }) => {
      id.data.programmatic_json.fields.forEach((field: { field_name: any; fields: any; }) => {

        const { field_name, fields } = field;
        // Check if the value is an object (indicating it's a tuple)
        if (Array.isArray(fields)) {
          console.info('UserPosition2 its a tuple:', fields);
          // If it's a tuple, iterate through its elements and push each one to the extractedValues array
          fields.forEach((tupleElement: any, index: number) => {
            const tupleFieldName = `${field_name}_${index + 1}`; // Creating a unique field name for each element of the tuple
            extractedValues.push({ field_name: tupleElement.field_name, value: tupleElement.value });
          });
        } 
      });
    });
    console.info('UserPosition2 what does it contains:', extractedValues);

    // Find the elements by their IDs

    
  })
  .catch(error => {
      console.error('Error fetching data:', error);
  });
}