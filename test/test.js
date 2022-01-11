/*
RUN
npx hardhat test
*/

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TheSystem", function () {
  let TheSystem, contract, owner, addr1, addr2;

  beforeEach(async () => {
    TheSystem = await ethers.getContractFactory('TheSystem');
    contract = await TheSystem.deploy();
    [owner, addr1, addr2, _] = await ethers.getSigners();

    uri = "https://ipfs.io/ipfs/abc/card";

    await contract.setBaseURI(uri);

    maxSupply = 1000;
    await contract.changeMint();

    id = 1;
    owned = 10;

    id1 = 1;
    id2 = 2;
    owned1 = 120;
    owned2 = 180;
  })

  describe('Deployment', () => {
    it("Should set the right owner", async () => {
      expect(await contract.owner()).to.equal(owner.address);
    })
  })

  describe('setBaseURI', () => {
    it("test setBaseURI", async () => {
      await contract.setBaseURI(uri)
      expect(await contract.uri(1)).to.equal(uri + "1.json")
    })
    it("setBaseURI should REVERT if not called by owner", async () => {
      await expect(contract.connect(addr1).setBaseURI("paolo"))
        .to.be.revertedWith("Ownable: caller is not the owner")
    })
  })

  describe('renounceOwnership', () => {
    it("renouceOwnership should assign contract ownership to 0x00000", async () => {
      await contract.renounceOwnership()
      expect(await contract.owner()).to.equal('0x0000000000000000000000000000000000000000')
    })
    it("renouceOwnership can be called only by Owner", async () => {
      await expect(contract.connect(addr1).renounceOwnership())
        .to.be.revertedWith("Ownable: caller is not the owner")
    })
  })

  describe('tranfer Ownership', () => {
    it("transferOwnership should tranfer contract ownership", async () => {
      await contract.transferOwnership(addr2.address)
      expect(await contract.owner()).to.equal(addr2.address)
    })
    it("transferOwnership can be called only by Owner", async () => {
      await expect(contract.connect(addr1).transferOwnership(addr2.address))
        .to.be.revertedWith("Ownable: caller is not the owner")
    })
  })

  describe('activateBatch', () => {
    it("activateBatch should activate specific ids[] (only Owner)", async () => {
      await contract.activateBatch([2, 7, 8]);
      expect(await contract.connect(addr1).isActiveID(1)).to.equal(false);
      expect(await contract.connect(addr1).isActiveID(7)).to.equal(true);
      expect(await contract.uri(7)).to.equal(uri + "7.json");
    })
    it("activateBatch should REVERT if called from others", async () => {
      await expect(contract.connect(addr1).activateBatch([1, 3]))
        .to.be.revertedWith("Ownable: caller is not the owner")
    })
  })

  describe('setMaxSupply', () => {
    it("setMaxSupply should set maxSupply for all cards (only Owner)", async () => {
      await contract.setMaxSupply(1000);
      expect(await contract.maxSupply()).to.equal(1000);
    })
    it("setMaxSupply should REVERT if called from others", async () => {
      await expect(contract.connect(addr1).setMaxSupply(1000))
        .to.be.revertedWith("Ownable: caller is not the owner")
    })
    it("setMaxSupply should REVERT if amount <= maxSupply", async () => {
      await contract.setMaxSupply(1000);
      await expect(contract.setMaxSupply(800))
        .to.be.revertedWith("Revert: amount too small")
    })
  })

  describe('mint', () => {
    it("mint should REVERT if token is not active", async () => {
      await expect(contract.mint(addr1.address, id, 10, []))
        .to.be.revertedWith("Revert: not active")
    })
    it("mint should REVERT if maxSupply exedeed", async () => {
      await contract.activateBatch([id]);
      await contract.setMaxSupply(maxSupply);
      expect(await contract.maxSupply()).to.equal(maxSupply);
      await expect(contract.mint(addr1.address, id, maxSupply + 1, []))
        .to.be.revertedWith("Revert: maxSupply exceded")
    })
    it("mint should REVERT if system is paused", async () => {
      await contract.changeMint();
      await contract.activateBatch([id]);
      await contract.setMaxSupply(maxSupply);
      await expect(contract.mint(addr1.address, id, maxSupply, []))
        .to.be.revertedWith("Revert: paused")
    })
    it("mint should work if system is unpaused", async () => {
      await contract.changeMint();
      await contract.changeMint();
      await contract.activateBatch([1]);
      await contract.setMaxSupply(maxSupply);
      await contract.mint(addr1.address, id, maxSupply, []);
      expect(await contract.balanceOf(addr1.address, id)).to.equal(maxSupply);
    })
    it("mint should work if minter is not token receiver", async () => {
      await contract.activateBatch([1]);
      await contract.setMaxSupply(maxSupply);
      await contract.connect(addr1).mint(addr2.address, id, maxSupply, []);
      expect(await contract.balanceOf(addr2.address, id)).to.equal(maxSupply);
    })
  })

  describe('mintBatch', () => {
    it("mintBatch should REVERT if token is not active", async () => {
      await expect(contract.mintBatch(addr1.address, [id1, id2], [10, 10], []))
        .to.be.revertedWith("Revert: not active")
    })
    it("mintBatch should REVERT if maxSupply exedeed", async () => {
      await contract.setMaxSupply(maxSupply);
      await contract.activateBatch([id1, id2]);
      await expect(contract.mintBatch(addr1.address, [id1, id2], [maxSupply, maxSupply + 1], []))
        .to.be.revertedWith("Revert: maxSupply exceded")
    })
    it("mintBatch should REVERT if system is paused", async () => {
      await contract.changeMint();
      await contract.setMaxSupply(maxSupply);
      await contract.activateBatch([id1, id2]);
      await expect(contract.mintBatch(addr1.address, [id1, id2], [maxSupply, maxSupply], []))
        .to.be.revertedWith("Revert: paused")
    })
    it("mintBatch should work if system is unpaused", async () => {
      await contract.changeMint();
      await contract.changeMint();
      await contract.setMaxSupply(maxSupply);
      await contract.activateBatch([id1, id2]);
      await contract.mintBatch(addr1.address, [id1, id2], [owned1, owned2], []);
      result = await contract.balanceOfBatch([addr1.address, addr1.address], [id1, id2]);
      expect(result[0]).to.be.equal(owned1);
      expect(result[1]).to.be.equal(owned2);
    })
    it("mintBatch should work if minter is add1 and tokens are for add2", async () => {
      await contract.changeMint();
      await contract.changeMint();
      await contract.setMaxSupply(maxSupply);
      await contract.activateBatch([id1, id2]);
      await contract.connect(addr1).mintBatch(addr2.address, [id1, id2], [owned1, owned2], []);
      result = await contract.balanceOfBatch([addr2.address, addr2.address], [id1, id2]);
      expect(result[0]).to.be.equal(owned1);
      expect(result[1]).to.be.equal(owned2);
    })
  })

  describe('mintBatch', () => {
    it("mintBatch should REVERT if token is not active", async () => {
      await expect(contract.mint(addr1.address, [id1, id2], [owned1, owned2], []))
        .to.be.revertedWith("Revert: not active")
    })
    it("mintBatch should REVERT if maxSupply exedeed", async () => {
      await contract.setMaxSupply(maxSupply);
      await contract.activateBatch([id1, id2]);
      await expect(contract.mintBatch(addr1.address, [id1, id2], [maxSupply, maxSupply + 1], []))
        .to.be.revertedWith("Revert: maxSupply exceded")
    })
    it("mintBatch should REVERT if system is paused", async () => {
      await contract.changeMint();
      await contract.setMaxSupply(maxSupply);
      await contract.activateBatch([id1, id2]);
      await expect(contract.mintBatch(addr1.address, [id1, id2], [maxSupply, maxSupply], []))
        .to.be.revertedWith("Revert: paused")
    })
    it("mintBatch should work if system is unpaused", async () => {
      await contract.changeMint();
      await contract.changeMint();
      await contract.setMaxSupply(maxSupply);
      await contract.activateBatch([id1, id2]);
      await contract.mintBatch(addr1.address, [id1, id2], [owned1, owned2], []);
      result = await contract.balanceOfBatch([addr1.address, addr1.address], [id1, id2]);
      expect(result[0]).to.be.equal(owned1);
      expect(result[1]).to.be.equal(owned2);
    })
    it("mintBatch should work if if minter is add1 and tokens are for add2", async () => {
      await contract.changeMint();
      await contract.changeMint();
      await contract.setMaxSupply(maxSupply);
      await contract.activateBatch([id1, id2]);
      await contract.connect(addr1).mintBatch(addr2.address, [id1, id2], [owned1, owned2], []);
      result = await contract.balanceOfBatch([addr2.address, addr2.address], [id1, id2]);
      expect(result[0]).to.be.equal(owned1);
      expect(result[1]).to.be.equal(owned2);
    })
  })

  describe('burn', () => {
    it("burn should REVERT if token to burn > token owned ", async () => {
      await contract.activateBatch([id]);
      await contract.setMaxSupply(maxSupply);
      await contract.mint(addr1.address, id, owned, [])
      await expect(contract.connect(addr1).burn(addr1.address, id, owned + 1))
        .to.be.revertedWith("VM Exception while processing transaction: reverted with panic code 0x11 (Arithmetic operation underflowed or overflowed outside of an unchecked block)")
    })
    it("burn should REVERT if addr2 wants to burn addr1 tokens (and is not approved by addrs1)", async () => {
      await contract.activateBatch([id]);
      await contract.setMaxSupply(maxSupply);
      await contract.mint(addr1.address, id, owned, [])
      await expect(contract.connect(addr2).burn(addr1.address, id, owned))
        .to.be.revertedWith("ERC1155: caller is not owner")
    })
    it("burn should work if addr2 wants to burn addr1 tokens and IS APPROVED by addrs1. Tansaction power increase for addr1", async () => {
      await contract.activateBatch([id]);
      await contract.setMaxSupply(maxSupply);
      await contract.mint(addr1.address, id, owned, []);
      await contract.changeMint();
      await contract.connect(addr1).setApprovalForAll(addr2.address, true)
      await contract.connect(addr2).burn(addr1.address, id, owned)
      expect(await contract.myPower(addr1.address))
        .to.be.equal(owned);
    })
  })

  describe('burnBatch', () => {
    it("burnBatch should REVERT if token to burn > token owned ", async () => {
      await contract.setMaxSupply(maxSupply);
      await contract.activateBatch([id1, id2]);
      await contract.mintBatch(addr1.address, [id1, id2], [owned1, owned2], [])
      await expect(contract.connect(addr1).burnBatch(addr1.address, [id1, id2], [owned1, owned2 + 1]))
        .to.be.revertedWith("VM Exception while processing transaction: reverted with panic code 0x11 (Arithmetic operation underflowed or overflowed outside of an unchecked block)")
    })
    it("burnBatch should REVERT if addr2 wants to burn addr1 tokens (and is not approved by addrs1)", async () => {
      await contract.setMaxSupply(maxSupply);
      await contract.activateBatch([id1, id2]);
      await contract.mintBatch(addr1.address, [id1, id2], [owned1, owned2], [])
      await expect(contract.connect(addr2).burnBatch(addr1.address, [id1, id2], [owned1, owned2]))
        .to.be.revertedWith("ERC1155: caller is not owner")
    })
    it("burnBatch should work if addr2 wants to burn addr1 tokens and IS APPROVED by addrs1. Tansaction power increase for addr1", async () => {
      await contract.setMaxSupply(maxSupply);
      await contract.activateBatch([id1, id2]);
      await contract.mintBatch(addr1.address, [id1, id2], [owned1, owned2], [])
      await contract.changeMint();
      await contract.connect(addr1).setApprovalForAll(addr2.address, true)
      await contract.connect(addr2).burnBatch(addr1.address, [id1, id2], [owned1, owned2])
      expect(await contract.myPower(addr1.address))
        .to.be.equal(owned1 + owned2);
    })
  })

  describe('changeMint', () => {
    it("changeMint basic test", async () => {
      expect(await contract.mintActive())
        .to.be.equal(true);
      await contract.changeMint()
      expect(await contract.mintActive())
        .to.be.equal(false);
      await contract.changeMint()
      expect(await contract.mintActive())
        .to.be.equal(true);
    })
    it("changeMint can be callee only by owner", async () => {
      await expect(contract.connect(addr1).changeMint())
        .to.be.revertedWith("Ownable: caller is not the owner")
    })
  })

  describe('safeTransferFrom', () => {
    it("safeTransferFrom work if address From has enough token and transaction power", async () => {
      await contract.activateBatch([id]);
      await contract.setMaxSupply(maxSupply);
      await contract.mint(owner.address, id, 2 * owned, [])
      await contract.burn(owner.address, id, owned)
      await contract.safeTransferFrom(owner.address, addr1.address, id, owned, [])
      expect(await contract.balanceOf(addr1.address, id)).to.equal(owned)
    })
    it("safeTransferFrom can be called by others if approved (addr2 trasfers on behalf of addr1)", async () => {
      await contract.activateBatch([id]);
      await contract.setMaxSupply(maxSupply);
      await contract.connect(addr1).mint(addr1.address, id, 2 * owned, [])
      await contract.connect(addr1).burn(addr1.address, id, owned)
      await contract.connect(addr1).setApprovalForAll(addr2.address, true)
      await contract.connect(addr2).safeTransferFrom(addr1.address, addr2.address, id, owned, [])
      expect(await contract.balanceOf(addr2.address, id)).to.equal(owned)
    })
    it("safeTransferFrom REVERT if called by others not approved (addr2 can not not trasfers on behalf of addr1)", async () => {
      await contract.activateBatch([id]);
      await contract.setMaxSupply(maxSupply);
      await contract.connect(addr1).mint(addr1.address, id, 2 * owned, [])
      await contract.connect(addr1).burn(addr1.address, id, owned)
      await expect(contract.connect(addr2).safeTransferFrom(addr1.address, addr2.address, id, owned, []))
        .to.be.revertedWith("ERC1155: caller is not owner");
    })
    it("safeTransferFrom REVERT if not enough token", async () => {
      await contract.activateBatch([id]);
      await contract.setMaxSupply(maxSupply);
      await contract.mint(owner.address, id, 2 * owned, [])
      await contract.burn(owner.address, id, owned + 1)
      await expect(contract.safeTransferFrom(owner.address, addr1.address, id, owned, []))
        .to.be.revertedWith("ERC1155: insufficient balance for transfer");
    })
    it("safeTransferFrom REVERT if not enough transaction power", async () => {
      await contract.activateBatch([id]);
      await contract.setMaxSupply(maxSupply);
      await contract.mint(owner.address, id, 2 * owned, [])
      await contract.burn(owner.address, id, owned - 1)
      await expect(contract.safeTransferFrom(owner.address, addr1.address, id, owned, []))
        .to.be.revertedWith("Revert: more _power needed");
    })
    it("safeTransferFrom if addr1 has freetranspower < amount and send token to addr2", async () => {
      await contract.activateBatch([id]);
      await contract.setMaxSupply(maxSupply);
      await contract.mint(addr1.address, id, 2 * owned, [])
      await contract.mint(addr2.address, id, 2 * owned, [])
      await contract.connect(addr2).burn(addr2.address, id, owned)
      await contract.connect(addr2).safeTransferFrom(addr2.address, addr1.address, id, 2, [])
      await contract.connect(addr1).safeTransferFrom(addr1.address, addr2.address, id, 1, [])
    })
    it("safeTransferFrom if addr1 has received X token from addr2, addr2 can send back X tokens without transaction power", async () => {
      await contract.activateBatch([id]);
      await contract.setMaxSupply(maxSupply);
      await contract.mint(addr1.address, id, 2 * owned, [])
      await contract.connect(addr1).burn(addr1.address, id, owned)
      expect(await contract.myPower(addr1.address)).to.equal(owned)
      await contract.connect(addr1).safeTransferFrom(addr1.address, addr2.address, id, owned, [])
      expect(await contract.balanceOf(addr2.address, id)).to.equal(owned)
      expect(await contract.myPower(addr2.address)).to.equal(0)
      await contract.connect(addr2).safeTransferFrom(addr2.address, addr1.address, id, owned, [])
      expect(await contract.balanceOf(addr1.address, id)).to.equal(owned)
    })
    it("safeTransferFrom if addr1 has received X token from addr2, addr2 can not send back X+y tokens without adding y transaction power", async () => {
      let y = 5;
      await contract.activateBatch([id]);
      await contract.setMaxSupply(maxSupply);

      expect(await contract.myPower(addr1.address)).to.equal(0)
      expect(await contract.myPower(addr2.address)).to.equal(0)
      expect(await contract.interactions(addr1.address, addr2.address)).to.equal(0)
      expect(await contract.interactions(addr2.address, addr1.address)).to.equal(0)
      expect(await contract.balanceOf(addr1.address, id)).to.equal(0)
      expect(await contract.balanceOf(addr2.address, id)).to.equal(0)

      await contract.mint(addr1.address, id, 2 * owned, [])
      await contract.connect(addr1).burn(addr1.address, id, owned)
      await contract.mint(addr2.address, id, 3 * y, [])
      await contract.connect(addr2).burn(addr2.address, id, y)
      expect(await contract.myPower(addr2.address)).to.equal(y)


      expect(await contract.myPower(addr1.address)).to.equal(owned)
      expect(await contract.myPower(addr2.address)).to.equal(y)
      expect(await contract.interactions(addr1.address, addr2.address)).to.equal(0)
      expect(await contract.interactions(addr2.address, addr1.address)).to.equal(0)
      expect(await contract.balanceOf(addr1.address, id)).to.equal(owned)
      expect(await contract.balanceOf(addr2.address, id)).to.equal(2 * y)

      await contract.connect(addr1).safeTransferFrom(addr1.address, addr2.address, id, owned, [])

      expect(await contract.myPower(addr1.address)).to.equal(0)
      expect(await contract.myPower(addr2.address)).to.equal(y)
      expect(await contract.interactions(addr1.address, addr2.address)).to.equal(owned)
      expect(await contract.interactions(addr2.address, addr1.address)).to.equal(0)
      expect(await contract.balanceOf(addr1.address, id)).to.equal(0)
      expect(await contract.balanceOf(addr2.address, id)).to.equal(2 * y + owned)

      expect(contract.connect(addr2).safeTransferFrom(addr2.address, addr1.address, id, owned + y + 1, []))
        .to.be.revertedWith("Revert: more _power needed");
      // addr2 can now send owned + y tokens to addr1 with just y power (not more)
      await contract.connect(addr2).safeTransferFrom(addr2.address, addr1.address, id, owned + y, [])

      expect(await contract.balanceOf(addr1.address, id)).to.equal(owned + y)
      expect(await contract.balanceOf(addr2.address, id)).to.equal(2 * y + owned - (owned + y))
      expect(await contract.myPower(addr1.address)).to.equal(0)
      expect(await contract.myPower(addr2.address)).to.equal(0)
      expect(await contract.interactions(addr1.address, addr2.address)).to.equal(owned)
      expect(await contract.interactions(addr2.address, addr1.address)).to.equal(owned + y)

      // now addr1 can send to addr2 y token without power
      await contract.mint(addr1.address, id, y, [])
      await contract.connect(addr1).safeTransferFrom(addr1.address, addr2.address, id, y, [])
    })
  })

  describe('safeBatchTransferFrom', () => {
    it("safeBatchTransferFrom work if address From has enough token and transaction power", async () => {
      await contract.setMaxSupply(maxSupply);
      await contract.activateBatch([id1, id2]);
      await contract.mintBatch(addr1.address, [id1, id2], [2 * owned1, 2 * owned2], [])
      await contract.connect(addr1).burnBatch(addr1.address, [id1, id2], [owned1, owned2])

      expect(await contract.myPower(addr1.address)).to.equal(owned1 + owned2)
      await contract.connect(addr1).safeBatchTransferFrom(addr1.address, addr2.address, [id1, id2], [owned1, owned2], [])
      expect(await contract.balanceOf(addr2.address, id1)).to.equal(owned1)
      expect(await contract.balanceOf(addr2.address, id2)).to.equal(owned2)
    })
    it("safeBatchTransferFrom can be called by others if approved (addr2 trasfers on behalf of addr1)", async () => {
      await contract.setMaxSupply(maxSupply);
      await contract.activateBatch([id1, id2]);
      await contract.mintBatch(addr1.address, [id1, id2], [2 * owned1, 2 * owned2], [])
      await contract.connect(addr1).burnBatch(addr1.address, [id1, id2], [owned1, owned2])
      await contract.connect(addr1).setApprovalForAll(addr2.address, true)
      await contract.connect(addr2).safeBatchTransferFrom(addr1.address, addr2.address, [id1, id2], [owned1, owned2], [])
      expect(await contract.balanceOf(addr2.address, id1)).to.equal(owned1)
      expect(await contract.balanceOf(addr2.address, id2)).to.equal(owned2)
    })
    it("safeBatchTransferFrom REVERT called by others if not approved", async () => {
      await contract.setMaxSupply(maxSupply);
      await contract.activateBatch([id1, id2]);
      await contract.mintBatch(addr1.address, [id1, id2], [2 * owned1, 2 * owned2], [])
      await contract.connect(addr1).burnBatch(addr1.address, [id1, id2], [owned1, owned2])
      await expect(contract.connect(addr2).safeBatchTransferFrom(addr1.address, addr2.address, [id1, id2], [owned1, owned2], []))
        .to.be.revertedWith("ERC1155: caller is not owner");
    })
    it("safeBatchTransferFrom REVERT if not enough token", async () => {
      await contract.setMaxSupply(maxSupply);
      await contract.activateBatch([id1, id2]);
      await contract.mintBatch(addr1.address, [id1, id2], [2 * owned1, 2 * owned2], [])
      await contract.connect(addr1).burnBatch(addr1.address, [id1, id2], [owned1, owned2 + 1])
      await expect(contract.connect(addr1).safeBatchTransferFrom(addr1.address, addr2.address, [id1, id2], [owned1, owned2], []))
        .to.be.revertedWith("ERC1155: insufficient balance for transfer");
    })
    it("safeBatchTransferFrom REVERT if not enough transaction power", async () => {
      await contract.setMaxSupply(maxSupply);
      await contract.activateBatch([id1, id2]);
      await contract.mintBatch(addr1.address, [id1, id2], [2 * owned1, 2 * owned2], [])
      await contract.connect(addr1).burnBatch(addr1.address, [id1, id2], [owned1, owned2 - 1])
      await expect(contract.connect(addr1).safeBatchTransferFrom(addr1.address, addr2.address, [id1, id2], [owned1, owned2], []))
        .to.be.revertedWith("Revert: more _power needed");
    })
    it("safeBatchTransferFrom if addr1 has freetranspower < amount and send token to addr2", async () => {
      await contract.setMaxSupply(maxSupply);
      await contract.activateBatch([id1, id2]);
      await contract.mintBatch(addr1.address, [id2, id2], [2 * owned1, 2 * owned2], [])
      await contract.mintBatch(addr2.address, [id2, id2], [2 * owned1, 2 * owned2], [])
      await contract.connect(addr2).burnBatch(addr2.address, [id2, id2], [owned1, 2 * owned2])
      await contract.connect(addr2).safeBatchTransferFrom(addr2.address, addr1.address, [id2, id2], [2, 2], [])
      await contract.connect(addr1).safeBatchTransferFrom(addr1.address, addr2.address, [id2, id2], [1, 1], [])
    })
    it("safeBatchTransferFrom if addr1 has received X token from addr2, addr2 can send back X tokens without transaction power", async () => {
      await contract.setMaxSupply(maxSupply);
      await contract.activateBatch([id1, id2]);
      await contract.mintBatch(addr1.address, [id1, id2], [2 * owned1, 2 * owned2], [])
      await contract.connect(addr1).burnBatch(addr1.address, [id1, id2], [owned1, owned2])

      expect(await contract.myPower(addr1.address)).to.equal(owned1 + owned2)
      await contract.connect(addr1).safeBatchTransferFrom(addr1.address, addr2.address, [id1, id2], [owned1, owned2], [])
      expect(await contract.balanceOf(addr2.address, id1)).to.equal(owned1)
      expect(await contract.balanceOf(addr2.address, id2)).to.equal(owned2)
      expect(await contract.myPower(addr1.address)).to.equal(0)
      expect(await contract.myPower(addr2.address)).to.equal(0)

      await contract.connect(addr2).safeBatchTransferFrom(addr2.address, addr1.address, [id1, id2], [owned1, owned2], [])
      expect(await contract.balanceOf(addr1.address, id1)).to.equal(owned1)
      expect(await contract.balanceOf(addr1.address, id2)).to.equal(owned2)
    })
    it("safeBatchTransferFrom if addr1 has received X token from addr2, addr2 can not send back X+y tokens without adding y transaction power", async () => {
      let y = 5;
      await contract.setMaxSupply(maxSupply);
      await contract.activateBatch([id1, id2]);
      await contract.mintBatch(addr1.address, [id1, id2], [2 * owned1, 2 * owned2], [])
      await contract.connect(addr1).burnBatch(addr1.address, [id1, id2], [owned1, owned2])

      await contract.mintBatch(addr2.address, [id1, id2], [2 * y, 2 * y], [])
      await contract.connect(addr2).burnBatch(addr2.address, [id1, id2], [y, y])

      expect(await contract.myPower(addr1.address)).to.equal(owned1 + owned2)
      expect(await contract.myPower(addr2.address)).to.equal(2 * y)
      expect(await contract.interactions(addr1.address, addr2.address)).to.equal(0)
      expect(await contract.interactions(addr2.address, addr1.address)).to.equal(0)
      expect(await contract.balanceOf(addr1.address, id1)).to.equal(owned1)
      expect(await contract.balanceOf(addr1.address, id2)).to.equal(owned2)
      expect(await contract.balanceOf(addr2.address, id1)).to.equal(y)
      expect(await contract.balanceOf(addr2.address, id2)).to.equal(y)

      await contract.connect(addr1).safeBatchTransferFrom(addr1.address, addr2.address, [id1, id2], [owned1, owned2], [])

      expect(await contract.myPower(addr1.address)).to.equal(0)
      expect(await contract.myPower(addr2.address)).to.equal(2 * y)
      expect(await contract.interactions(addr1.address, addr2.address)).to.equal(owned1 + owned2)
      expect(await contract.interactions(addr2.address, addr1.address)).to.equal(0)
      expect(await contract.balanceOf(addr1.address, id)).to.equal(0)
      expect(await contract.balanceOf(addr2.address, id1)).to.equal(y + owned1)

      await expect(contract.connect(addr2).safeBatchTransferFrom(addr2.address, addr1.address, [id1, id2], [owned1 + y, owned2 + y + 1], []))
        .to.be.revertedWith("Revert: more _power needed");
      // addr2 can now send owned + y tokens to addr1 with just y power (not more)

      await contract.connect(addr2).safeBatchTransferFrom(addr2.address, addr1.address, [id1, id2], [owned1 + y, owned2 + y], [])

      expect(await contract.balanceOf(addr1.address, id1)).to.equal(owned1 + y)
      expect(await contract.balanceOf(addr1.address, id2)).to.equal(owned2 + y)
      expect(await contract.balanceOf(addr2.address, id1)).to.equal(0)
      expect(await contract.balanceOf(addr2.address, id2)).to.equal(0)
      expect(await contract.myPower(addr1.address)).to.equal(0)
      expect(await contract.myPower(addr2.address)).to.equal(0)
      expect(await contract.interactions(addr1.address, addr2.address)).to.equal(owned1 + owned2)
      expect(await contract.interactions(addr2.address, addr1.address)).to.equal(owned1 + owned2 + 2 * y)

      // now addr1 can send to addr2 2*y token without power
      await contract.mint(addr1.address, id1, 2 * y, [])
      await contract.connect(addr1).safeTransferFrom(addr1.address, addr2.address, id1, 2 * y, [])
    })
  })

  describe('setApprovalForAll ', () => {
    it("setApprovalForAll should be work", async () => {
      expect(await contract.isApprovedForAll(addr1.address, addr2.address)).to.equal(false)
      await contract.connect(addr1).setApprovalForAll(addr2.address, true)
      expect(await contract.isApprovedForAll(addr1.address, addr2.address)).to.equal(true)
    })
  })

  describe('EVENTS', () => {
    it("setBaseURI should EMIT NewUri(sring _newURI) event", async () => {
      await expect(contract.setBaseURI("paolo"))
        .to.emit(contract, "NewUri")
        .withArgs("paolo");
    })
    it("setMaxSupply should EMIT SetMaxSupply(uint256 _value) event", async () => {
      await expect(contract.setMaxSupply(50))
        .to.emit(contract, "SetMaxSupply")
        .withArgs(50);
    })

    it("activateBatch should EMIT ActivateBatch(uint256[] _ids) event", async () => {
      await expect(contract.activateBatch([1, 2]))
        .to.emit(contract, "ActivateBatch")
        .withArgs([1, 2]);
    })
    it("changeMint should EMIT MintStatus(bool) event", async () => {
      await expect(contract.changeMint())
        .to.emit(contract, "MintStatus")
        .withArgs(false);
      await expect(contract.changeMint())
        .to.emit(contract, "MintStatus")
        .withArgs(true);
    })
    it("safeTransferFrom, mint & burn should EMIT TransferSingle(operator, from, to, id, value) event", async () => {
      await contract.activateBatch([id]);
      await contract.setMaxSupply(maxSupply);
      await expect(contract.mint(owner.address, id, 2 * owned, []))
        .to.emit(contract, "TransferSingle")
        .withArgs(owner.address, "0x0000000000000000000000000000000000000000", owner.address, id, 2 * owned);
      await expect(contract.burn(owner.address, id, owned))
        .to.emit(contract, "TransferSingle")
        .withArgs(owner.address, owner.address, "0x0000000000000000000000000000000000000000", id, owned);
      await expect(contract.safeTransferFrom(owner.address, addr1.address, id, owned, []))
        .to.emit(contract, "TransferSingle")
        .withArgs(owner.address, owner.address, addr1.address, id, owned);
    })
    it("safeBatchTransferFrom, mintBatch & burnBatch should EMIT TransferBatch(operator, from, to, ids, values) event", async () => {
      await contract.setMaxSupply(maxSupply);
      await contract.activateBatch([id1, id2]);
      await expect(contract.mintBatch(addr1.address, [id1, id2], [2 * owned1, 2 * owned2], []))
        .to.emit(contract, "TransferBatch")
        .withArgs(owner.address, "0x0000000000000000000000000000000000000000", addr1.address, [id1, id2], [2 * owned1, 2 * owned2]);
      await expect(contract.connect(addr1).burnBatch(addr1.address, [id1, id2], [owned1, owned2]))
        .to.emit(contract, "TransferBatch")
        .withArgs(addr1.address, addr1.address, "0x0000000000000000000000000000000000000000", [id1, id2], [owned1, owned2]);
      await expect(contract.connect(addr1).safeBatchTransferFrom(addr1.address, addr2.address, [id1, id2], [owned1, owned2], []))
        .to.emit(contract, "TransferBatch")
        .withArgs(addr1.address, addr1.address, addr2.address, [id1, id2], [owned1, owned2]);
    })
    it("setApprovalForAll should EMIT ApprovalForAll(account, operator, approved) event", async () => {
      await expect(contract.connect(addr1).setApprovalForAll(addr2.address, true))
        .to.emit(contract, "ApprovalForAll")
        .withArgs(addr1.address, addr2.address, true);
    })
  })
})