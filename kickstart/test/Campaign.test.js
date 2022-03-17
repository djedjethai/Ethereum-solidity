const assert = require('assert')
const ganache = require('ganache-cli')
const Web3 = require('web3')
const web3 = new Web3(ganache.provider())

const campaignCtx = require('../ethereum/build/Campaign.json')
const factoryCtx = require('../ethereum/build/CampaignFactory.json')

let accounts
let campaignAdr
let factory
let campaign

beforeEach(async () => {
	accounts = await web3.eth.getAccounts()

	factory = await new web3.eth.Contract(JSON.parse(factoryCtx.interface))
		.deploy({data: factoryCtx.bytecode})
		.send({from: accounts[0], gas: '1000000'})

	await factory.methods.createCampaign('100').send({
		from: accounts[0],
		gas: '1000000'
	})

	let addresses = await factory.methods.getDeployedCampaigns().call()
	campaignAdr = addresses[0]

	campaign = await new web3.eth.Contract(
		JSON.parse(campaignCtx.interface),
		campaignAdr
	)

})

describe('campaign contract', () => {
	
	it('deploy the contract', () => {
		assert.ok(factory.options.address)
		assert.ok(campaign.options.address)
	})

	it('make sure the campaign creator is mark as the manager', async() => {
		let campaignManager = await campaign.methods.manager().call()
		assert.equal(accounts[0], campaignManager)
			
	})

	// [1] contribute to campaign => assert with approvers and money
	it('insuficient contribution can not contribute', async() => {
		try{
			await campaign.methods.contribute().send({
				from: accounts[1],
				value: web3.utils.toWei('0.00000000000000001', 'ether' )
			})
			assert(false)
		} catch(e) {
			assert(e)
		}
	})

	it('contribute', async() => {
		await campaign.methods.contribute().send({
			from: accounts[1],
			value: web3.utils.toWei('0.01', 'ether' )
		})
		
		const approvedInMap = await campaign.methods.approvers(accounts[1]).call()
		const approversCount = await campaign.methods.approversCount().call()

		assert.equal(true, approvedInMap)
		assert.equal(1, approversCount)
	})

	// create a request => assert with requests[0]
	it('make sure a request can be created', async() => {
		await campaign.methods.createRequest("test createRequest", 2000, accounts[5]).send({
			from: accounts[0],
			gas: '1000000'
		})		    
		let reqs = await campaign.methods.requests(0).call();	
		assert.equal(accounts[5], reqs.recipient)
	})	

	
	// test approve request
	it('make sure the approve vote comes from an approvers', async() => {
		await campaign.methods.contribute().send({
			from: accounts[1],
			value: web3.utils.toWei('0.01', 'ether' )
		})

		await campaign.methods.createRequest("test createRequest", 2000, accounts[5]).send({
			from: accounts[0],
			gas: '1000000'
		})	

		let theErr = false
		try{
			await campaign.methods.approveRequest(0).send({
				from: accounts[7],
				gas: '1000000'
			})
			theErr = true
			assert(false)

		} catch(e) {
			if(theErr === false){
				assert(true)
			} else {
				assert.fail()
			}
		}
	})

	it('make sure the approval vote has been register in the req approvals', async() => {
		await campaign.methods.contribute().send({
			from: accounts[1],
			value: web3.utils.toWei('0.01', 'ether' )
		})

		await campaign.methods.createRequest("test createRequest", 2000, accounts[5]).send({
			from: accounts[0],
			gas: '1000000'
		})	
	
		await campaign.methods.approveRequest(0).send({
			from: accounts[1],
			gas: '1000000'
		})

		let theErr = false
		try{
			// as the "approvals" key in the struct Request
			// do not show up, let check it by renewing the request
			// it should be block as this contributor already approved
			await campaign.methods.approveRequest(0).send({
				from: accounts[1],
				gas: '1000000'
			})
			theErr = true
			assert(false)

		} catch(e) {
			if(theErr === false){
				assert(true)
			} else {
				assert.fail()
			}
		}

	})

	it('make sure the approvalCount increase', async() => {
		await campaign.methods.contribute().send({
			from: accounts[1],
			value: web3.utils.toWei('0.01', 'ether' )
		})

		await campaign.methods.createRequest("test createRequest", 2000, accounts[5]).send({
			from: accounts[0],
			gas: '1000000'
		})	
	
		await campaign.methods.approveRequest(0).send({
			from: accounts[1],
			gas: '1000000'
		})
		
		const req = await campaign.methods.requests(0).call()
		
		assert.equal(1, req.approvalCount)
	})
	

	// test finalize the request 
	it('make sure approvalCount <= approvalCount / 2 fail block finalRequest', async() => {
		await campaign.methods.contribute().send({
			from: accounts[1],
			value: web3.utils.toWei('0.01', 'ether' )
		})

		await campaign.methods.contribute().send({
			from: accounts[2],
			value: web3.utils.toWei('0.01', 'ether' )
		})
	
		await campaign.methods.createRequest("test createRequest", 2000, accounts[5]).send({
			from: accounts[0],
			gas: '1000000'
		})	
	
		await campaign.methods.approveRequest(0).send({
			from: accounts[1],
			gas: '1000000'
		})

		let theErr = false
		try{
			await campaign.methods.finalizeRequest(0).send({
				from: accounts[0],
				gas: '1000000'
			})
			theErr = true
			assert(false)

		} catch(e) {
			if(theErr === false){
				assert(true)
			} else {
				assert.fail()
			}
		}
	})

	it('make sure approvalCount > approvalCount / 2 fail allow finalRequest', async() => {
		await campaign.methods.contribute().send({
			from: accounts[1],
			value: web3.utils.toWei('0.01', 'ether' )
		})

		await campaign.methods.contribute().send({
			from: accounts[2],
			value: web3.utils.toWei('0.01', 'ether' )
		})
	
		await campaign.methods.contribute().send({
			from: accounts[3],
			value: web3.utils.toWei('0.01', 'ether' )
		})

		await campaign.methods.createRequest("test createRequest", 2000, accounts[5]).send({
			from: accounts[0],
			gas: '1000000'
		})	
	
		await campaign.methods.approveRequest(0).send({
			from: accounts[1],
			gas: '1000000'
		})

		await campaign.methods.approveRequest(0).send({
			from: accounts[2],
			gas: '1000000'
		})

		try{
			await campaign.methods.finalizeRequest(0).send({
				from: accounts[0],
				gas: '1000000'
			})
			assert(true)

		} catch(e) {
			assert.fail()
		}


	})

	it('make sure the request.complete is true at the end', async() => {
		await campaign.methods.contribute().send({
			from: accounts[1],
			value: web3.utils.toWei('0.01', 'ether' )
		})
			
		await campaign.methods.createRequest("test createRequest", 2000, accounts[5]).send({
			from: accounts[0],
			gas: '1000000'
		})	
	
		await campaign.methods.approveRequest(0).send({
			from: accounts[1],
			gas: '1000000'
		})

		await campaign.methods.finalizeRequest(0).send({
			from: accounts[0],
			gas: '1000000'
		})

		const req = await campaign.methods.requests(0).call()
		
		assert.ok(req.complete)
	})


	it('make sure finalizeRequest() can not run if request.complete is true', async() => {
		await campaign.methods.contribute().send({
			from: accounts[1],
			value: web3.utils.toWei('0.01', 'ether' )
		})
			
		await campaign.methods.createRequest("test createRequest", 2000, accounts[5]).send({
			from: accounts[0],
			gas: '1000000'
		})	
	
		await campaign.methods.approveRequest(0).send({
			from: accounts[1],
			gas: '1000000'
		})

		await campaign.methods.finalizeRequest(0).send({
			from: accounts[0],
			gas: '1000000'
		})
		
		let theErr = false
		try{
			await campaign.methods.finalizeRequest(0).send({
				from: accounts[0],
				gas: '1000000'
			})
			theErr = true
			assert(false)

		} catch(e) {
			if(theErr === false){
				assert(true)
			} else {
				assert.fail()
			}
		}
	})

	// confirm transaction
	it('make sure the money is transfered to the targetted account', async() => {
		await campaign.methods.contribute().send({
			from: accounts[1],
			value: web3.utils.toWei('0.01', 'ether' )
		})
			
		await campaign.methods.createRequest("test createRequest", 2000, accounts[5]).send({
			from: accounts[0],
			gas: '1000000'
		})	
	
		await campaign.methods.approveRequest(0).send({
			from: accounts[1],
			gas: '1000000'
		})
		const balancebf = await web3.eth.getBalance(accounts[5])

		await campaign.methods.finalizeRequest(0).send({
				from: accounts[0],
				gas: '1000000'
		})

		const balance = await web3.eth.getBalance(accounts[5])
		
		assert.ok(balancebf < balance)
	})
})


