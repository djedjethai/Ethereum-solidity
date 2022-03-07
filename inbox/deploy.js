// Infura Endpoint
// https://rinkeby.infura.io/v3/7d533bd1b9444f9c9be768a4139728ee
// a tool to see our deployed contracts or/and our account
// https://rinkeby.etherscan.io/


// hdwallet is our provider
// it add our wallet credential to our w3 instance 
// and connect it to the selected network

// right now my contract is deployed at 
// 0x3301DE019fC661CBba2A7d3aEb6c440857188F70

const HDWalletProvider = require('@truffle/hdwallet-provider')
const Web3 = require('web3')
const { interface, bytecode } = require('./compile.js')

const provider = new HDWalletProvider(
	'slender truck inflict heart between chief bacon power scout raw flash fence',
	'https://rinkeby.infura.io/v3/7d533bd1b9444f9c9be768a4139728ee'
)

const web3 = new Web3(provider)

const deploy = async() => {
	// list of the account which have been unlock by our provider(so my account)
	const account = await web3.eth.getAccounts()

	console.log('my account: ', account[0])

	const result = await new web3.eth.Contract(JSON.parse(interface))
		.deploy({data: bytecode, arguments: ["hi there !"]})
		.send({gas: '1000000', from: account[0]})

	// need to record the address of where our contract have beeen deployed
	// on the network, otherwise we do not know...
	console.log('contract deployed to: ', result)
	// to prevent hanging deployment
	provider.engine.stop()
}

deploy()




