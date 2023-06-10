import { Contract, Signer } from "ethers"
import { ethers, network, deployments, getNamedAccounts } from "hardhat"
import { localChains } from "../../hardhat-helper-config"
import { assert, expect } from "chai"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"

!localChains.includes(network.name)
    ? describe.skip
    : describe("Nft Marketplace Unit Tests", function () {
          let nftMarketplace: Contract,
              basicNft: Contract,
              mockNftMarket: Contract,
              deployer: string,
              player: SignerWithAddress
          const PRICE = ethers.utils.parseEther("0.1")
          const TOKEN_ID = 0
          this.beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer
              const accounts = await ethers.getSigners()
              player = accounts[1]
              await deployments.fixture(["all"])
              nftMarketplace = await ethers.getContract("NftMarketplace")
              basicNft = await ethers.getContract("BasicNft")
              mockNftMarket = await ethers.getContract("MockNftMarket")
              await basicNft.mintNft()
              await basicNft.approve(nftMarketplace.address, TOKEN_ID)
          })
          describe("listItem", function () {
              it("lists and can be bought", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  await nftMarketplace
                      .connect(player)
                      .buyItem(basicNft.address, TOKEN_ID, { value: PRICE })
                  const newOwner = await basicNft.ownerOf(TOKEN_ID)
                  const deployerProceeds = await nftMarketplace.getProceeds(deployer)
                  assert.equal(newOwner.toString(), player.address)
                  assert.equal(deployerProceeds.toString(), PRICE.toString())
              })
              it("emits an event after listing an item", async function () {
                  expect(await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)).to.emit(
                      nftMarketplace,
                      "ItemListed"
                  )
              })
              it("exclusively items that haven't been listed", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWithCustomError(nftMarketplace, "NftMarketplace__AlreadyListed")
              })
              it("exclusively allows owners to list", async function () {
                  await basicNft.approve(player.address, TOKEN_ID)
                  await expect(
                      nftMarketplace.connect(player).listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWithCustomError(nftMarketplace, "NftMarketplace__NotOwner")
              })
              it("needs approvals to list item", async function () {
                  await basicNft.approve(ethers.constants.AddressZero, TOKEN_ID)
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWithCustomError(
                      nftMarketplace,
                      "NftMarketplace__NotApprovedForMarketplace"
                  )
              })
              it("Updates listing with seller and price", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  const listing = await nftMarketplace.getListing(basicNft.address, TOKEN_ID)
                  assert(listing.price.toString() == PRICE.toString())
                  assert(listing.seller.toString() == deployer)
              })
              it("reverts if the price be 0", async () => {
                  const ZERO_PRICE = ethers.utils.parseEther("0")
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, ZERO_PRICE)
                  ).revertedWithCustomError(nftMarketplace, "NftMarketplace__PriceMustBeAboveZero")
              })
          })
          describe("buyItem", function () {
              it("reverts if the item isn't listed", async function () {
                  await expect(
                      nftMarketplace.buyItem(basicNft.address, TOKEN_ID, { value: PRICE })
                  ).to.be.revertedWithCustomError(nftMarketplace, "NftMarketplace__NotListed")
              })
              it("reverts if the price isn't met", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  await expect(
                      nftMarketplace.buyItem(basicNft.address, TOKEN_ID, { value: PRICE.sub(10) })
                  ).to.be.revertedWithCustomError(nftMarketplace, "NftMarketplace__PriceNotMet")
              })
              it("transfers the nft to the buyer and updates the internal proceeds record ", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  await nftMarketplace
                      .connect(player)
                      .buyItem(basicNft.address, TOKEN_ID, { value: PRICE })
                  const owner = await basicNft.ownerOf(TOKEN_ID)
                  assert.equal(owner, player.address)
                  const proceeds = await nftMarketplace.getProceeds(deployer)
                  assert.equal(proceeds.toString(), PRICE.toString())
              })
          })
          describe("cancelListing", function () {
              it("reverts if there is no listing", async function () {
                  await expect(
                      nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWithCustomError(nftMarketplace, "NftMarketplace__NotListed")
              })
              it("reverts if called by anyone except the owner", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  await expect(
                      nftMarketplace.connect(player).cancelListing(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWithCustomError(nftMarketplace, "NftMarketplace__NotOwner")
              })
              it("emits an event and removes listing from marketplace", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  expect(await nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)).to.emit(
                      nftMarketplace,
                      "ItemCanceled"
                  )
              })
          })
          describe("updateListing", function () {
              it("must be owner and listed", async function () {
                  await expect(
                      nftMarketplace.updateListing(basicNft.address, TOKEN_ID, PRICE.add(10))
                  ).to.be.revertedWithCustomError(nftMarketplace, "NftMarketplace__NotListed")
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  await expect(
                      nftMarketplace
                          .connect(player)
                          .updateListing(basicNft.address, TOKEN_ID, PRICE.add(10))
                  ).to.be.revertedWithCustomError(nftMarketplace, "NftMarketplace__NotOwner")
              })
              it("updates the price of the item", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  await nftMarketplace.updateListing(basicNft.address, TOKEN_ID, PRICE.add(10))
                  const listingPrice = (await nftMarketplace.getListing(basicNft.address, TOKEN_ID))
                      .price
                  assert.equal(PRICE.add(10).toString(), listingPrice.toString())
              })
          })
          describe("withdrawProceeds", function () {
              it("doesn't allow withdraws if there is nothing to withdraw", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  const proceeds = await nftMarketplace.getProceeds(deployer)
                  assert.equal(proceeds.toString(), "0")
                  await expect(nftMarketplace.withdrawProceeds()).to.be.revertedWithCustomError(
                      nftMarketplace,
                      "NftMarketplace__NoProceeds"
                  )
              })
              it("withdraws the proceeds", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  await nftMarketplace
                      .connect(player)
                      .buyItem(basicNft.address, TOKEN_ID, { value: PRICE })
                  const proceedsBeforeWithdraw = await nftMarketplace.getProceeds(deployer)
                  assert.equal(proceedsBeforeWithdraw.toString(), PRICE.toString())
                  const deployerAsSigner = (await ethers.getSigners())[0]
                  const balanceBeforeWithdraw = await deployerAsSigner.getBalance()

                  const tx = await nftMarketplace.withdrawProceeds()
                  const receipt = await tx.wait(1)
                  const gasSpent = receipt.cumulativeGasUsed
                      .mul(receipt.effectiveGasPrice)
                      .toString()
                  const proceedsAfterWithdraw = await nftMarketplace.getProceeds(deployer)
                  assert.equal(proceedsAfterWithdraw.toString(), "0")
                  const balanceAfterWithdraw = await deployerAsSigner.getBalance()
                  assert.equal(
                      balanceBeforeWithdraw.add(PRICE).toString(),
                      balanceAfterWithdraw.add(gasSpent).toString()
                  )
              })
              it("reverts on transfer failed", async function () {
                  //transfer ownership to mock contract.
                  await basicNft.transferFrom(deployer, mockNftMarket.address, TOKEN_ID)
                  await mockNftMarket.mockListItem(basicNft.address, TOKEN_ID, PRICE)
                  await nftMarketplace
                      .connect(player)
                      .buyItem(basicNft.address, TOKEN_ID, { value: PRICE })

                  //will be called by mock contract, which will not be able to receive funds in withdraw's call function.
                  await expect(mockNftMarket.mockWithdraw()).to.be.revertedWithCustomError(
                      nftMarketplace,
                      "NftMarketplace__TransferFailed"
                  )
              })
          })
      })
