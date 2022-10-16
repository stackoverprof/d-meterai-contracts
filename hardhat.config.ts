import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import '@nomiclabs/hardhat-etherscan';
import '@typechain/hardhat';
import 'hardhat-gas-reporter';
import 'hardhat-abi-exporter';
import 'solidity-coverage';
import 'dotenv/config';

const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL || '';
const PRIVATE_KEY = process.env.PRIVATE_KEY || '';
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || '';
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || '';

const config: HardhatUserConfig = {
	solidity: '0.8.17',
	defaultNetwork: 'hardhat',
	networks: {
		hardhat: {},
		localhost: {
			url: 'http://127.0.0.1:8545/',
			chainId: 31337,
		},
		goerli: {
			url: GOERLI_RPC_URL,
			chainId: 5,
			accounts: [PRIVATE_KEY],
		},
	},
	etherscan: {
		apiKey: ETHERSCAN_API_KEY,
	},
	gasReporter: {
		enabled: true,
		outputFile: 'gas-report.txt',
		noColors: true,
		currency: 'IDR',
		coinmarketcap: COINMARKETCAP_API_KEY,
		token: 'ETH',
		showTimeSpent: true,
	},
	abiExporter: {
		path: '../d-meterai-client/abi',
		runOnCompile: true,
		clear: true,
		flat: true,
		spacing: 2,
	},
};

export default config;
