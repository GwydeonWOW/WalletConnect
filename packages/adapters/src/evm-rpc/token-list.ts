export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
}

const ETH_TOKENS: TokenInfo[] = [
  { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
  { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
  { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 },
  { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol: 'WBTC', name: 'Wrapped BTC', decimals: 8 },
  { address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', symbol: 'LINK', name: 'Chainlink', decimals: 18 },
  { address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', symbol: 'UNI', name: 'Uniswap', decimals: 18 },
  { address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', symbol: 'AAVE', name: 'Aave', decimals: 18 },
  { address: '0xc00e94Cb662C3520282E6f5717214004A7f26888', symbol: 'COMP', name: 'Compound', decimals: 18 },
  { address: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2', symbol: 'MKR', name: 'Maker', decimals: 18 },
  { address: '0x5E8422345238F34275888049021821E8E08CAa1f', symbol: 'frxETH', name: 'Frax Ether', decimals: 18 },
  { address: '0x6982508145454Ce325dDbE47a25d4ec3d2311933', symbol: 'PEPE', name: 'Pepe', decimals: 18 },
  { address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE', symbol: 'SHIB', name: 'Shiba Inu', decimals: 18 },
  { address: '0x68749665FF8D2d112fa17B8Fd13A2eCC2a0bd6E6', symbol: 'LDO', name: 'Lido DAO', decimals: 18 },
  { address: '0x4d224452801ACEd8B2F0aebE155379bb5D594381', symbol: 'APE', name: 'ApeCoin', decimals: 18 },
  { address: '0xE41d2489571d322189246DaFA5ebDe1F4699F498', symbol: 'ZRX', name: '0x Protocol', decimals: 18 },
  { address: '0x0D8775F648430679A709E98d2b0Cb6250d2887EF', symbol: 'BAT', name: 'Basic Attention Token', decimals: 18 },
  { address: '0xBB0E17EF65F82Ab018d8EDd776e8DD940327B28b', symbol: 'AXS', name: 'Axie Infinity', decimals: 18 },
  { address: '0x3506424F91fD33084466F402d5D97f05F8e3b4AF', symbol: 'CHZ', name: 'Chiliz', decimals: 18 },
  { address: '0x2b591e99afE9f32eAA6214f7B7629768C40Eeb39', symbol: 'HEX', name: 'HEX', decimals: 8 },
];

const POLYGON_TOKENS: TokenInfo[] = [
  { address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
  { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', symbol: 'USDC', name: 'USD Coin (PoS)', decimals: 6 },
  { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', symbol: 'USDT', name: 'Tether USD (PoS)', decimals: 6 },
  { address: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', symbol: 'WBTC', name: 'Wrapped BTC', decimals: 8 },
  { address: '0xD6DF932A45C0f255f85145f286eA0b292B21C90B', symbol: 'AAVE', name: 'Aave (PoS)', decimals: 18 },
  { address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', symbol: 'WMATIC', name: 'Wrapped Matic', decimals: 18 },
  { address: '0x53E0bca35Ec356BD5ddDFebbD1Fc0fD03FaBad39', symbol: 'LINK', name: 'Chainlink (PoS)', decimals: 18 },
  { address: '0x8505b9d2254A7Ae468c0E9dd10Ccea3A837aef5c', symbol: 'COMP', name: 'Compound (PoS)', decimals: 18 },
  { address: '0xb33EaAd8d922B1083446DC23f610c2567fB5180f', symbol: 'UNI', name: 'Uniswap (PoS)', decimals: 18 },
];

const ARBITRUM_TOKENS: TokenInfo[] = [
  { address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
  { address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  { address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
  { address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f', symbol: 'WBTC', name: 'Wrapped BTC', decimals: 8 },
  { address: '0x912CE59144191C1204E64559FE8253a0e49E6548', symbol: 'ARB', name: 'Arbitrum', decimals: 18 },
  { address: '0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a', symbol: 'GMX', name: 'GMX', decimals: 18 },
  { address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 },
  { address: '0xf97f4df75117a78c1A5a0DBb814Af92458539784', symbol: 'LINK', name: 'Chainlink', decimals: 18 },
];

const OPTIMISM_TOKENS: TokenInfo[] = [
  { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
  { address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  { address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
  { address: '0x68f180fcCe6836688e9084f035309E29Bf0A2095', symbol: 'WBTC', name: 'Wrapped BTC', decimals: 8 },
  { address: '0x4200000000000000000000000000000000000042', symbol: 'OP', name: 'Optimism', decimals: 18 },
  { address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 },
  { address: '0x350a791Bfc2C21F9Ed5d10980Dad2e2638ffa7f6', symbol: 'LINK', name: 'Chainlink', decimals: 18 },
];

const BASE_TOKENS: TokenInfo[] = [
  { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
  { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  { address: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA', symbol: 'USDbC', name: 'USD Base Coin', decimals: 6 },
  { address: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22', symbol: 'cbETH', name: 'Coinbase Wrapped Staked ETH', decimals: 18 },
  { address: '0x04C0599Ae5A44757c0af6F9eC3b93da8116BCc0d', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 },
];

const BSC_TOKENS: TokenInfo[] = [
  { address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', symbol: 'WBNB', name: 'Wrapped BNB', decimals: 18 },
  { address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', symbol: 'USDC', name: 'USD Coin', decimals: 18 },
  { address: '0x55d398326f99059fF775485246999027B3197955', symbol: 'USDT', name: 'Tether USD', decimals: 18 },
  { address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', symbol: 'BUSD', name: 'Binance USD', decimals: 18 },
  { address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', symbol: 'ETH', name: 'Ethereum (BSC)', decimals: 18 },
  { address: '0x152649eA73beAb28c5b49B26e481fb0943a10564', symbol: 'BTCB', name: 'Bitcoin BEP2', decimals: 18 },
  { address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', symbol: 'CAKE', name: 'PancakeSwap', decimals: 18 },
];

const TOKEN_MAP: Record<string, TokenInfo[]> = {
  'eip155:1': ETH_TOKENS,
  'eip155:137': POLYGON_TOKENS,
  'eip155:42161': ARBITRUM_TOKENS,
  'eip155:10': OPTIMISM_TOKENS,
  'eip155:8453': BASE_TOKENS,
  'eip155:56': BSC_TOKENS,
};

export function getTokenList(chainRef: string): TokenInfo[] {
  return TOKEN_MAP[chainRef] ?? [];
}
