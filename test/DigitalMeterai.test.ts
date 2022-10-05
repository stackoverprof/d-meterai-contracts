import { ethers } from 'hardhat';
import { assert } from 'chai';
import { DigitalMeterai, DigitalMeterai__factory } from '../typechain-types';

describe('DigitalMeterai functionality tests', () => {
	let DigitalMeteraiFactory: DigitalMeterai__factory;
	let DigitalMeterai: DigitalMeterai;

	beforeEach(async () => {
		DigitalMeteraiFactory = (await ethers.getContractFactory(
			'DigitalMeterai'
		)) as DigitalMeterai__factory;
		DigitalMeterai = await DigitalMeteraiFactory.deploy();
		await DigitalMeterai.deployed();
	});

	it('Should initializes the NFT Correctly.', async () => {
		const name = await DigitalMeterai.name();
		const symbol = await DigitalMeterai.symbol();

		assert.equal(name, 'Digital Meterai');
		assert.equal(symbol, 'DMT');
	});

	it('Should start with initial token counter of 0', async () => {
		const currentValue = await DigitalMeterai.getTokensTotal();
		const expectedValue = 0;
		assert.equal(currentValue.toString(), expectedValue.toString());
	});

	it('Should mint several NFT, and updates appropriately', async () => {
		const txResponse = await DigitalMeterai.mint(24, ethers.utils.parseEther('0.0005'));

		await txResponse.wait(1);

		// assert if the token counter is updated
		const totalTokens = await DigitalMeterai.getTokensTotal();
		const totalTokens_expected = 24;
		assert.equal(totalTokens.toString(), totalTokens_expected.toString());

		const tokenId = 0;

		// assert if the token owner is the minter
		const owner = await DigitalMeterai.ownerOf(tokenId);
		const owner_expected = await DigitalMeterai.owner();
		assert.equal(owner, owner_expected);

		// assert if the token status is 0 (Available)
		const status = await DigitalMeterai.getTokenStatus(tokenId);
		const status_expected = 0;
		assert.equal(status, status_expected);

		// assert if the token is not bound to any document
		const document = await DigitalMeterai.getTokenDocument(tokenId);
		const document_expected = '';
		assert.equal(document, document_expected);
	});

	it('Should change ownership when someone buy the NFT', async () => {
		const txResponse = await DigitalMeterai.mint(1, ethers.utils.parseEther('0.0005'));
		await txResponse.wait(1);

		// buyer buy nft
		const [seller, buyer] = await ethers.getSigners();
		const sellerInitialBalance = await seller.getBalance();

		const tokenId = 0;
		const price = await DigitalMeterai.getTokenPrice(tokenId);
		const txResponse2 = await DigitalMeterai.connect(buyer).buy(tokenId, {
			value: price,
		});
		await txResponse2.wait(1);

		// assert if buyer now owns the token
		const owner = await DigitalMeterai.ownerOf(tokenId);
		assert.equal(owner, buyer.address);

		// assert if seller received the payment
		const sellerFinalBalance = await seller.getBalance();
		assert.equal(sellerFinalBalance.toString(), sellerInitialBalance.add(price).toString());

		// assert if status changed to 1 (Paid)
		const status = await DigitalMeterai.getTokenStatus(tokenId);
		const status_expected = 1;
		assert.equal(status, status_expected);
	});

	it('Should change token status to 2 (Bound) when the token is bound to a document', async () => {
		const txResponse = await DigitalMeterai.mint(1, ethers.utils.parseEther('0.0005'));
		await txResponse.wait(1);

		// buyer buy nft
		const [_, buyer] = await ethers.getSigners();

		const tokenId = 0;
		const price = await DigitalMeterai.getTokenPrice(tokenId);
		const txResponse2 = await DigitalMeterai.connect(buyer).buy(tokenId, {
			value: price,
		});
		await txResponse2.wait(1);

		// buyer bind the token to a document
		const sampleDocument = 'ipfs://QmaVkBn2tKmjbhphU7eyztbvSQU5EXDdqRyXZtRhSGgJGo';
		const txResponse3 = await DigitalMeterai.connect(buyer).bind(tokenId, sampleDocument);
		await txResponse3.wait(1);

		// assert if tokenDocument is updated
		const document = await DigitalMeterai.getTokenDocument(tokenId);
		assert.equal(document, sampleDocument);

		// assert if status changed to 2 (Used)
		const status = await DigitalMeterai.getTokenStatus(tokenId);
		const status_expected = 2;
		assert.equal(status, status_expected);
	});
});

