import { ethers } from 'hardhat';
import { assert } from 'chai';
import { DigitalMeterai, DigitalMeterai__factory } from '../typechain-types';

describe('DigitalMeterai functionality tests', () => {
	let DigitalMeteraiFactory: DigitalMeterai__factory;
	let DigitalMeterai: DigitalMeterai;

	beforeEach(async () => {
		// Deploy the contract before each test
		DigitalMeteraiFactory = (await ethers.getContractFactory(
			'DigitalMeterai'
		)) as DigitalMeterai__factory;
		DigitalMeterai = await DigitalMeteraiFactory.deploy();
		await DigitalMeterai.deployed();
	});

	it('Should initializes the NFT Correctly.', async () => {
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

	it('Should mint several NFT, and updates appropriately', async () => {
		const txResponse = await DigitalMeterai.mint(24, ethers.utils.parseEther('0.0005'));
		const receipt = await txResponse.wait(1);
		const tokenIds = receipt.events?.find((event) => event.event === 'DMT___Minted')?.args
			?.tokenIds;
		if (!tokenIds) return assert.fail('No tokenIds found');

		// Assert if the total supply is updated
		const totalTokens = await DigitalMeterai.getTotalSupply();
		const totalTokens_expected = 24;
		assert.equal(totalTokens.toString(), totalTokens_expected.toString());

		const totalAvailableTokens = await DigitalMeterai.getTotalSupplyByStatus(0);
		const totalAvailableTokens_expected = 24;
		assert.equal(totalAvailableTokens.toString(), totalAvailableTokens_expected.toString());

		// Assert if the token owner is the minter
		const owner = await DigitalMeterai.ownerOf(tokenIds[0]);
		const owner_expected = await DigitalMeterai.owner();
		assert.equal(owner, owner_expected);

		// Assert if the token status is 0 (Available)
		const { status, document } = await DigitalMeterai.getToken(tokenIds[0]);
		const status_expected = 0;
		assert.equal(status, status_expected);

		// Assert if the token is not bound to any document
		const document_expected = '';
		assert.equal(document, document_expected);
	});

	it('Should change ownership when someone buy the NFT', async () => {
		const txResponse = await DigitalMeterai.mint(1, ethers.utils.parseEther('0.0005'));
		const receipt = await txResponse.wait(1);
		const tokenIds = receipt.events?.find((event) => event.event === 'DMT___Minted')?.args
			?.tokenIds;
		if (!tokenIds) return assert.fail('No tokenIds found');

		// Buyer to buy nft
		const [seller, buyer] = await ethers.getSigners();
		const sellerInitialBalance = await seller.getBalance();

		const targetToken = await DigitalMeterai.connect(buyer).getAvailableToken();
		const price = targetToken.price;
		const txResponse2 = await DigitalMeterai.connect(buyer).buy(targetToken.tokenId, {
			value: price,
		});
		const receipt2 = await txResponse2.wait(1);
		const tokenId = receipt2.events?.find((event) => event.event === 'DMT___Bought')?.args
			?.tokenId;
		if (!tokenId) return assert.fail('No tokenId found');
		assert.equal(tokenIds[0].toString(), tokenId.toString());

		// Assert if buyer now owns the token
		const owner = await DigitalMeterai.ownerOf(tokenId);
		assert.equal(owner, buyer.address);

		const ownedTokens = await DigitalMeterai.connect(buyer).getMyTokens();
		assert.equal(ownedTokens.length, 1);

		// Assert if seller received the payment
		const sellerFinalBalance = await seller.getBalance();
		assert.equal(sellerFinalBalance.toString(), sellerInitialBalance.add(price).toString());

		// Assert if status changed to 1 (Paid)
		const { status } = await DigitalMeterai.getToken(tokenId);
		const status_expected = 1;
		assert.equal(status, status_expected);

		// Assert supplies
		const totalAvailableTokens = await DigitalMeterai.getTotalSupplyByStatus(0);
		const totalAvailableTokens_expected = 0;
		assert.equal(totalAvailableTokens.toString(), totalAvailableTokens_expected.toString());
	});

	it('Should change token status to 2 (Bound) when the token is bound to a document', async () => {
		const txResponse = await DigitalMeterai.mint(1, ethers.utils.parseEther('0.0005'));
		const receipt = await txResponse.wait(1);
		const tokenIds = receipt.events?.find((event) => event.event === 'DMT___Minted')?.args
			?.tokenIds;
		if (!tokenIds) return assert.fail('No tokenIds found');

		// Buyer to buy nft
		const [_, buyer] = await ethers.getSigners();

		const targetToken = await DigitalMeterai.connect(buyer).getAvailableToken();
		const price = targetToken.price;
		const txResponse2 = await DigitalMeterai.connect(buyer).buy(targetToken.tokenId, {
			value: price,
		});
		const receipt2 = await txResponse2.wait(1);
		const tokenId = receipt2.events?.find((event) => event.event === 'DMT___Bought')?.args
			?.tokenId;
		if (!tokenId) return assert.fail('No tokenId found');

		// Buyer bind the token to a document
		const sampleDocument = 'ipfs://QmaVkBn2tKmjbhphU7eyztbvSQU5EXDdqRyXZtRhSGgJGo';
		const txResponse3 = await DigitalMeterai.connect(buyer).bind(tokenId, sampleDocument);
		await txResponse3.wait(1);

		// Assert if tokenDocument is updated
		const { status, document } = await DigitalMeterai.getToken(tokenId);
		assert.equal(document, sampleDocument);

		// Assert if status changed to 2 (Used)
		const status_expected = 2;
		assert.equal(status, status_expected);
	});
});

