const HDWalletProvider = require('@truffle/hdwallet-provider');
const Web3 = require('web3');
const { interface, bytecode } = require('./compile');

const provider = new HDWalletProvider( 
  // remember to change this to your own phrase!
  'slender truck inflict heart between chief bacon power scout raw flash fence',
  // remember to change this to your own endpoint!
  'https://rinkeby.infura.io/v3/7d533bd1b9444f9c9be768a4139728ee'
)

const web3 = new Web3(provider);

const deploy = async () => {
  const accounts = await web3.eth.getAccounts();

  console.log('Attempting to deploy from account', accounts[0]);

  const result = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({ data: bytecode })
    .send({ gas: '1000000', from: accounts[0] });

  // get the ABI to then install it into react(and browser)
  console.log("Interface: ", interface)	
  // get our address as contract deployer, to then inject it into react(and browser) 
  console.log('Contract deployed to', result.options.address);
  provider.engine.stop();
};
deploy();
