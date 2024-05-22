clear 
set -e

export xrd=resource_sim1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxakj8n3

echo "Resetting environment"
resim reset
export owner_account=$(resim new-account | sed -nr "s/Account component address: ([[:alnum:]_]+)/\1/p")
echo "Owner Account = " $owner_account
echo "XRD = " $xrd

echo "Creating tokens"
export demo1=$(resim new-token-fixed --name "DEMO1" 100000 --symbol "DEMO1" | sed -nr "s/└─ Resource: ([[:alnum:]_]+)/\1/p")
export demo2=$(resim new-token-fixed --name "DEMO2" 100000 --symbol "DEMO2" | sed -nr "s/└─ Resource: ([[:alnum:]_]+)/\1/p")

echo "Publishing dapp"
export dapp_package=$(resim publish . | sed -nr "s/Success! New Package: ([[:alnum:]_]+)/\1/p")
echo "Package = " $dapp_package

# output=`resim call-function $dapp_package Tokenizer instantiate 5 TKN timebased | awk '/Component: |Resource: / {print $NF}'`
output=`resim call-function $dapp_package Tokenizer instantiate 5 TKN timebased $xrd $demo1 | awk '/Component: |Resource: / {print $NF}'`
export component=`echo $output | cut -d " " -f1`
export owner_badge=`echo $output | cut -d " " -f2`
export admin_badge=`echo $output | cut -d " " -f3`
export tokenizer_token=`echo $output | cut -d " " -f4`
export userdata_nft_manager=`echo $output | cut -d " " -f5`
export pt=`echo $output | cut -d " " -f6`
export yt=`echo $output | cut -d " " -f7`


export component_test=component_sim1cptxxxxxxxxxfaucetxxxxxxxxx000527798379xxxxxxxxxhkrefh

echo 'output = '$output

echo 'component = '$component
echo 'owner_badge = '$owner_badge
echo 'admin_badge = '$admin_badge
echo 'tokenizer_token = ' $tokenizer_token
echo 'userdata_nft_manager = ' $userdata_nft_manager
echo 'pt = ' $pt
echo 'yt = ' $yt

echo ' '
echo 'account = ' $owner_account
echo 'xrd = ' $xrd
echo 'test faucet for lock fee = ' $component_test
echo ' '

resim show $owner_account

echo ' > owner'
resim show $owner_badge
echo ' > admin'
resim show $admin_badge
echo ' > lnd'
resim show $userdata_nft_manager
echo ' > zero unit'
resim show $tokenizer_token
echo ' > pt'
resim show $pt
echo ' > yt'
resim show $yt

echo '>>> Extend Lending Pool High'
export amount='10000'
resim run rtm/extend_lending_pool.rtm

# echo '>>> Add Token 1'
# export token=resource_sim1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxakj8n3
# resim run rtm/add_token.rtm
# echo '>>> Add Token 2'
# export token=$demo1
# resim run rtm/add_token.rtm
# echo '>>> Add Token 3'
# export token=$demo2
# resim run rtm/add_token.rtm

# echo '>>> Fund Main Vault'
# resim run rtm/fund.rtm

# echo '>>> Register'
# resim run rtm/register.rtm

# export account=$(resim new-account | sed -nr "s/Account component address: ([[:alnum:]_]+)/\1/p")
# echo "Account = " $account

export account=$owner_account
echo '>>> Register'
resim run rtm/register.rtm

# echo '>>> Register Again'
# resim run rtm/register_again.rtm

export resource_address=resource_sim1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxakj8n3

echo '>>> Set Reward 10 at epoch 1'
export amount_reward='10'
resim set-current-epoch 1
resim run rtm/set_reward.rtm

echo '>>> Set Extra Reward 10 at epoch 1'
export amount_reward='10'
resim run rtm/set_extra.rtm

export amount='10000'
echo '>>> Lend tokens of type xrd'
resim set-current-epoch 1
#resim call-method ${component} supply $xrd:100
resim run rtm/supply_high.rtm

# 10000 xrd supplied in

echo '>>> Tokenize 10000 for 8000 epoch'
export length='8000'
resim run rtm/tokenize_yield.rtm

# 10000 xrd tokenized for one month


export amount_reward='9'
echo '>>> Set Reward ${amount_reward} at epoch 1000'
resim set-current-epoch 1000
resim run rtm/set_extra.rtm

# interest rates rises


echo '>>> Redeem'
export amount='10000'
resim run rtm/redeem.rtm

resim show $account

