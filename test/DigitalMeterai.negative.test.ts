import { ethers } from 'hardhat';
import { assert, expect } from 'chai';
import { DigitalMeterai, DigitalMeterai__factory } from '../typechain-types';

describe('DigitalMeterai negative and prevention tests', () => {
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

	it('Should fail to mint if not contract owner', async () => {
		const [owner, addr1] = await ethers.getSigners();

		// Expect contract owner to mint successfully
		const OwnerMinting = DigitalMeterai.connect(owner).mint(
			1,
			ethers.utils.parseEther('0.0005')
		);
		await expect(OwnerMinting).to.not.be.reverted;

		// Expect non contract owner to mint unsuccessfully
		const NonOwnerMinting = DigitalMeterai.connect(addr1).mint(
			1,
			ethers.utils.parseEther('0.0005')
		);
		await expect(NonOwnerMinting).to.be.reverted;
	});

	it('Should fail to buy if balance is insufficient', async () => {
		const txResponse = await DigitalMeterai.mint(24, ethers.utils.parseEther('0.0005'));
		const receipt = await txResponse.wait(1);
		const tokenIds = receipt.events?.find((event) => event.event === 'DMT___Minted')?.args
			?.tokenIds;
		if (!tokenIds) return assert.fail('No tokenIds found');

		// Expect buyer send wrong amount of ether and fail
		const [_, buyer] = await ethers.getSigners();
		const targetToken = await DigitalMeterai.connect(buyer).getAvailableToken();
		const call = DigitalMeterai.connect(buyer).buy(targetToken.tokenId, {
			value: ethers.utils.parseEther('0.0001'),
		});

		await expect(call).to.be.revertedWithCustomError(
			DigitalMeterai,
			'DMT___InvalidTransactionIncorrectValue'
		);
	});

	it('Should fail to buy if token is already sold', async () => {
		const txResponse = await DigitalMeterai.mint(24, ethers.utils.parseEther('0.0005'));
		const receipt = await txResponse.wait(1);
		const tokenIds = receipt.events?.find((event) => event.event === 'DMT___Minted')?.args
			?.tokenIds;
		if (!tokenIds) return assert.fail('No tokenIds found');

		// Buyer to buy nft
		const [_, buyer1, buyer2] = await ethers.getSigners();
		const targetToken = await DigitalMeterai.connect(buyer1).getAvailableToken();
		const price = targetToken.price;

		const txResponse2 = await DigitalMeterai.connect(buyer1).buy(targetToken.tokenId, {
			value: price,
		});
		const receipt2 = await txResponse2.wait(1);
		const tokenId = receipt2.events?.find((event) => event.event === 'DMT___Bought')?.args
			?.tokenId;
		if (!tokenId) return assert.fail('No tokenId found');

		const { status } = await DigitalMeterai.getToken(tokenId);
		assert.equal(status, 1);

		// Expect buyer2 to fail to buy nft
		const call = DigitalMeterai.connect(buyer2).buy(tokenId, {
			value: price,
		});

		await expect(call).to.be.revertedWithCustomError(
			DigitalMeterai,
			'DMT___UnmatchedStatusNotAvailable'
		);
	});

	it('Should fail to bind if not yet bought', async () => {
		const txResponse = await DigitalMeterai.mint(1, ethers.utils.parseEther('0.0005'));
		await txResponse.wait(1);

		const [_, buyer] = await ethers.getSigners();
		const targetToken = await DigitalMeterai.connect(buyer).getAvailableToken();
		const price = targetToken.price;

		const sampleDocument = 'ipfs://QmaVkBn2tKmjbhphU7eyztbvSQU5EXDdqRyXZtRhSGgJGo';

		// Expect buyer to fail to bind document because nft is not yet bought
		const call = DigitalMeterai.connect(buyer).bind(targetToken.tokenId, sampleDocument);
		await expect(call).to.be.revertedWithCustomError(
			DigitalMeterai,
			'DMT___UnmatchedStatusNotPaid'
		);
	});

	it('Should fail to bind if already bound', async () => {
		const txResponse = await DigitalMeterai.mint(1, ethers.utils.parseEther('0.0005'));
		await txResponse.wait(1);

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

		// First attempt to bind
		const sampleDocument1 = 'ipfs://QmaVkBn2tKmjbhphU7eyztbvSQU5EXDdqRyXZtRhSGgJGo';
		const sampleDocument2 = 'ipfs://QmZYmH5iDbD6v3U2ixoVAjioSzvWJszDzYdbeCLquGSpVm';
		const txResponse3 = await DigitalMeterai.connect(buyer).bind(tokenId, sampleDocument1);
		await txResponse3.wait(1);

		const { status } = await DigitalMeterai.getToken(tokenId);
		assert.equal(status, 2);

		// Second attempt to bind again should fail
		const call = DigitalMeterai.connect(buyer).bind(tokenId, sampleDocument2);
		await expect(call).to.be.revertedWithCustomError(
			DigitalMeterai,
			'DMT___UnmatchedStatusNotPaid'
		);
	});

	it('Should fail to bind if not token owner', async () => {
		const txResponse = await DigitalMeterai.mint(1, ethers.utils.parseEther('0.0005'));
		await txResponse.wait(1);

		const [_, buyer, binder] = await ethers.getSigners();
		const targetToken = await DigitalMeterai.connect(buyer).getAvailableToken();
		const price = targetToken.price;

		// Buyer to buy nft
		const txResponse2 = await DigitalMeterai.connect(buyer).buy(targetToken.tokenId, {
			value: price,
		});
		const receipt2 = await txResponse2.wait(1);
		const tokenId = receipt2.events?.find((event) => event.event === 'DMT___Bought')?.args
			?.tokenId;
		if (!tokenId) return assert.fail('No tokenId found');
		assert.equal(await DigitalMeterai.ownerOf(tokenId), buyer.address);

		const sampleDocument = 'ipfs://QmaVkBn2tKmjbhphU7eyztbvSQU5EXDdqRyXZtRhSGgJGo';

		// Expect binder to fail using other person's nft
		const call = DigitalMeterai.connect(binder).bind(tokenId, sampleDocument);
		await expect(call).to.be.revertedWithCustomError(
			DigitalMeterai,
			'DMT___ForbiddenActionsNotOwner'
		);
	});
});

