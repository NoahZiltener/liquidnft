const Blob = artifacts.require('./Blob.sol')

require('chai')
  .use(require('chai-as-promised'))
  .should()

  contract('Blob', (accounts) => {

    describe('deplyment', async() => {
      it('deplys successfully', async () =>{
        contract = await Blob.deployed()
        const address = contract.address
        console.log(address)
        assert.notEqual(address, '')
      })
    })

  })