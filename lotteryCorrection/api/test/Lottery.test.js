const assert = require('assert')
const ganache = require('ganache-cli')
const Web3 = require('web3')
const web3 = new Web3(ganache.provider())

const { interface, bytecode } = require('../compile')

// list of all our accounts(as global)
let lottery;
let accounts;

beforeEach(async () => {
	accounts = await web3.eth.getAccounts()

	lottery = await new web3.eth.Contract(JSON.parse(interface))
		.deploy({ data: bytecode })
		.send({ from: accounts[0], gas: '1000000' })
})

describe('Lottery function', () => {
	// make sure the contract has been deploy
	it('deploys a contract', () => {
		assert.ok(lottery.options.address)
	})	

	it('allow one account to be created', async() => {

		await lottery.methods.enter().send({
			from: accounts[0],
			value: web3.utils.toWei('0.02', 'ether')
		})

		// assert the user is added to the players
		let players = await lottery.methods.getPlayers().call({
			from: accounts[0]
		})
		assert.equal(1, players.length)
		assert.equal(accounts[0], players[0])
	})

	it('allow many accounts to be created', async() => {

		await lottery.methods.enter().send({
			from: accounts[0],
			value: web3.utils.toWei('0.02', 'ether')
		})

		await lottery.methods.enter().send({
			from: accounts[1],
			value: web3.utils.toWei('0.02', 'ether')
		})

		// assert the user is added to the players
		let players = await lottery.methods.getPlayers().call({
			from: accounts[0]
		})
		assert.equal(2, players.length)
		assert.equal(accounts[0], players[0])
		assert.equal(accounts[1], players[1])
	})

	it('require a minimum amount of ether', async() => {
		try{
			await lottery.methods.enter().send({
				from: accounts[0],
				value: web3.utils.toWei('0.005', 'ether')
			})
			assert(false)
		} catch(e){
			assert(e)
		}
	})

	it('verify that pickwinner can not be trigger by user', async() => {
		try{
			await lottery.methods.pickWinner().send({
				from: accounts[1]
			})
			assert(false)
		} catch(e){
			assert(e)
		}

	})

	it('send money to the winner and reset for next game', async() => {
		await lottery.methods.enter().send({
			from: accounts[0],
			value: web3.utils.toWei('2', 'ether')
		})

		let initialBalance = await web3.eth.getBalance(accounts[0])

		await lottery.methods.pickWinner().send({
			from: accounts[0]
		})

		let finalBalance = await web3.eth.getBalance(accounts[0])
		
		let diff = finalBalance -  initialBalance
		// not 2 some Gas have to be pay for the transaction
		assert(diff > web3.utils.toWei('1.8', 'ether'))

	})
})

