import { ethers } from 'hardhat';
import { BigNumber } from '@ethersproject/bignumber';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { assert, expect } from 'chai';
import { DigitalMeterai, DigitalMeterai__factory } from '../typechain-types';

const sampleDocument = 'ipfs://QmaVkBn2tKmjbhphU7eyztbvSQU5EXDdqRyXZtRhSGgJGo';
const samplePassword = '1234567890';

describe.only('DigitalMeterai functionality tests', async () => {
	let DigitalMeteraiFactory: DigitalMeterai__factory;
	let DigitalMeterai: DigitalMeterai;
	let TokenId: BigNumber;

	let address1: SignerWithAddress;
	let address2: SignerWithAddress;
	let address3: SignerWithAddress;

	before(async () => {
		// Deploy the contract before test
		DigitalMeteraiFactory = (await ethers.getContractFactory(
			'DigitalMeterai'
		)) as DigitalMeterai__factory;
		DigitalMeterai = await DigitalMeteraiFactory.deploy();
		await DigitalMeterai.deployed();

		[address1, address2, address3] = await ethers.getSigners();
	});

	it('Should do initialization correctly.', async () => {
		const name = await DigitalMeterai.name();
		const symbol = await DigitalMeterai.symbol();

		// Assert if token name and symbol is correct
		assert.equal(name, 'Digital Meterai');
		assert.equal(symbol, 'DMT');

		// Assert if id starts from 0 and no tokens yet
		const currentValue = await DigitalMeterai.getTotalSupply();
		const expectedValue = 0;
		assert.equal(currentValue.toString(), expectedValue.toString());
	});

	it('Should do the minting operation correctly', async () => {
		// Try minting 24 new token with 0.0005 ether price
		const txResponse = await DigitalMeterai.mint(24, ethers.utils.parseEther('0.0005'));
		const receipt = await txResponse.wait(1);
		const tokenIds = receipt.events?.find((event) => event.event === 'DMT___Minted')?.args
			?.tokenIds;
		if (!tokenIds) return assert.fail('No tokenIds found');

		// Assert if the total supply is updated
		const totalTokens = await DigitalMeterai.getTotalSupply();
		const totalTokens_expected = 24;
		assert.equal(totalTokens.toString(), totalTokens_expected.toString());
	});

	it('Should do the buying operation correctly', async () => {
		const sellerInitialBalance = await address1.getBalance();

		// Get one available token to buy
		const tokenData = await DigitalMeterai.connect(address2).getAvailableToken();
		TokenId = tokenData.tokenId;

		// Try buying the token
		const txResponse2 = await DigitalMeterai.connect(address2).buy(TokenId, {
			value: tokenData.price,
		});
		const receipt2 = await txResponse2.wait(1);
		const tokenId = receipt2.events?.find((event) => event.event === 'DMT___Bought')?.args
			?.tokenId;
		if (!tokenId) return assert.fail('No tokenId found');

		// Assert if buyer now owns the token
		const owner = await DigitalMeterai.connect(address2).ownerOf(tokenId);
		assert.equal(owner, address2.address);

		// Assert if buyer collections now equal 1
		const buyerCollections = await DigitalMeterai.connect(address2).balanceOf(address2.address);
		assert.equal(buyerCollections.toString(), '1');

		// Assert if seller received the payment
		const sellerFinalBalance = await address1.getBalance();
		assert.equal(
			sellerFinalBalance.toString(),
			sellerInitialBalance.add(tokenData.price).toString()
		);

		// Assert if token status changed to 1 (Paid)
		const { status } = await DigitalMeterai.connect(address2).getToken(tokenId);
		const status_expected = 1;
		assert.equal(status, status_expected);
	});

	it('Should do the binding operation correctly', async () => {
		// Buyer bind the token to a document
		const txResponse3 = await DigitalMeterai.connect(address2).bind(
			TokenId,
			sampleDocument,
			samplePassword
		);
		await txResponse3.wait(1);

		// Assert if tokenDocument is updated
		const { status, document } = await DigitalMeterai.connect(address2).getToken(TokenId);
		assert.equal(document, sampleDocument);

		// Assert if binder can get the password back
		const retrievedPassword = await DigitalMeterai.connect(address2).getPassword(TokenId);
		assert.equal(samplePassword, retrievedPassword);

		// Assert if status changed to 2 (Used)
		const status_expected = 2;
		assert.equal(status, status_expected);
	});

	it('Should do the access control correctly', async () => {
		// Try adding address3 to the access control list
		const txResponse4 = await DigitalMeterai.connect(address2).addAccessControl(
			TokenId,
			address3.address
		);
		await txResponse4.wait(1);

		// Assert if address3 can access the document
		const { document: document2 } = await DigitalMeterai.connect(address3).getToken(TokenId);
		assert.equal(document2, sampleDocument);

		// Assert if address3 can access the password
		const retrievedPassword2 = await DigitalMeterai.connect(address3).getPassword(TokenId);
		assert.equal(samplePassword, retrievedPassword2);
	});

	it('Prevent accessing if not listed in access control', async () => {
		// remove access from address3
		const txResponse5 = await DigitalMeterai.connect(address2).removeAccessControl(
			TokenId,
			address3.address
		);
		await txResponse5.wait(1);

		// Assert if address3 can no longer access the document
		const call = DigitalMeterai.connect(address3).getToken(TokenId);
		await expect(call).to.be.revertedWithCustomError(DigitalMeterai, 'ERROR___AccessDenied');

		// Assert if address3 can no longer access the password
		const call2 = DigitalMeterai.connect(address3).getPassword(TokenId);
		await expect(call2).to.be.revertedWithCustomError(DigitalMeterai, 'ERROR___AccessDenied');
	});

	it('Prevent minting if not contract owner', async () => {
		// Expect contract owner to mint successfully
		const OwnerMinting = DigitalMeterai.connect(address1).mint(
			1,
			ethers.utils.parseEther('0.0005')
		);
		await expect(OwnerMinting).to.not.be.reverted;

		// Expect non contract owner to mint unsuccessfully
		const NonOwnerMinting = DigitalMeterai.connect(address2).mint(
			1,
			ethers.utils.parseEther('0.0005')
		);
		await expect(NonOwnerMinting).to.be.reverted;
	});

	it('Prevent buying if balance is insufficient', async () => {
		// Expect buyer send wrong amount of ether and fail
		const targetToken = await DigitalMeterai.connect(address2).getAvailableToken();
		const call = DigitalMeterai.connect(address2).buy(targetToken.tokenId, {
			value: ethers.utils.parseEther('0.0001'),
		});

		await expect(call).to.be.revertedWithCustomError(DigitalMeterai, 'ERROR___InvalidPayment');
	});

	it('Prevent buying if token already sold', async () => {
		const call = DigitalMeterai.connect(address3).buy(TokenId, {
			value: ethers.utils.parseEther('0.0005'),
		});

		await expect(call).to.be.revertedWithCustomError(DigitalMeterai, 'ERROR___InvalidStatus');
	});

	it('Prevent binding if not yet bought', async () => {
		const tokenData = await DigitalMeterai.getAvailableToken();
		const call = DigitalMeterai.connect(address3).bind(
			tokenData.tokenId,
			sampleDocument,
			samplePassword
		);

		await expect(call).to.be.revertedWithCustomError(DigitalMeterai, 'ERROR___InvalidStatus');
	});

	it('Prevent binding if already used', async () => {
		// TokenId is already used, so it should not be able to be used anymore
		const call = DigitalMeterai.connect(address2).bind(TokenId, sampleDocument, samplePassword);

		await expect(call).to.be.revertedWithCustomError(DigitalMeterai, 'ERROR___InvalidStatus');
	});
});

