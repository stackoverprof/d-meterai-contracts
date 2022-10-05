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

	it('Initializes the NFT Correctly.', async () => {
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
		const txResponse = await DigitalMeterai.mint(24, 1);
		await txResponse.wait(1);

		const tokenCounter_result = await DigitalMeterai.getTokensTotal();
		const tokenCounter_expected = 24;
		assert.equal(tokenCounter_result.toString(), tokenCounter_expected.toString());
	});

	it('Should change ownership when someone buy the NFT', async () => {
		const txResponse = await DigitalMeterai.mint(24, ethers.utils.parseEther('4'));
		await txResponse.wait(1);

		// buyer buy nft
		const [seller, buyer] = await ethers.getSigners();
		const sellerInitialBalance = await seller.getBalance();

		const tokenId = 1;
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
	});
});

