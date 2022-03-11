const path = require("path")
const solc = require("solc")
const fs = require("fs-extra")

// delete old build dir
const buildPath = path.resolve(__dirname, 'build')
fs.removeSync(buildPath)

// compile the 2 contracts(which are in the same file)
const campaignPath = path.resolve(__dirname, 'contracts', 'Campaign.sol')
const source = fs.readFileSync(campaignPath, 'utf8')
const output = solc.compile(source, 1).contracts

// re-create the build dir and add the 2 compiled build(each one in his own file)
fs.ensureDirSync(buildPath)
for(let contract in output){
	fs.outputJsonSync(
		path.resolve(buildPath, (contract+'.json').substring(1)),
		output[contract]	
	)	
}
