// contract test code will go here
const assert = require('assert')
const ganache = require('ganache-cli')
const Web3 = require('web3')
const web3 = new Web3(ganache.provider())
const { interface, bytecode } = require('../compile.js')

const INITIAL_VALUE = 'Hi there'
let accounts
let inbox

beforeEach(async () => {
	// get a list of all accounts (provided by ganache)
	accounts = await web3.eth.getAccounts()

	// use one of these account for deploy
	// the contract
	inbox = await new web3.eth.Contract(JSON.parse(interface))
		.deploy({data: bytecode, arguments: [INITIAL_VALUE]})
		.send({from: accounts[0], gas: '1000000'})

})

describe('Inbox', () => {
	// make sure the deployment of the contract is working
	it('Deploy a contract', async() => {
		assert.ok(inbox.options.address)
	})

	it('has a default message', async() => {
		// we use call() as we just get datas(no changements)
		let aft = await inbox.methods.message().call()
		assert.equal(aft, INITIAL_VALUE)
	})

	it('can change the message', async() => {
		// console.log(inbox.methods)
		// we call send() as it is a transaction
		// inside the send({}) is who pay for the gas
		await inbox.methods.setMessage('new Message').send({from: accounts[0]})
		let aft = await inbox.methods.message().call()
		assert.equal(aft, 'new Message')
	})

})
