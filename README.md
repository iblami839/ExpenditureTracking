# Transparent Political Donation Smart Contract

A blockchain-based platform for transparent political campaign donations and expenditure tracking built on the Stacks blockchain. This smart contract system enables real-time tracking of political donations and ensures transparent fund allocation and spending.

## Features

- **Transparent Donation Tracking**: All donations are publicly recorded on the blockchain
- **Spending Categories**: Pre-defined spending categories with allocation limits
- **Expenditure Control**: Two-step expenditure process with proposal and approval phases
- **Real-time Balance Tracking**: Continuous tracking of campaign funds
- **Donor Analytics**: Track donation history and patterns
- **Access Control**: Role-based permissions for contract administration

## Prerequisites

- [Stacks CLI](https://docs.stacks.co/references/stacks-cli) installed
- Node.js v14+ and npm
- [Clarinet](https://github.com/hirosystems/clarinet) for local development
- Access to a Stacks node (local or testnet)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/your-repo/political-donation-contract
cd political-donation-contract
```

2. Install dependencies:
```bash
npm install
```

3. Build the contract:
```bash
clarinet build
```

## Contract Structure

### Core Components

1. **Data Maps**
```clarity
(define-map donors principal (tuple (total-donated uint) (last-donation uint)))
(define-map spending-categories (string-ascii 64) (tuple (allocated uint) (spent uint) (active bool)))
(define-map expenditures uint (tuple 
    (amount uint)
    (category (string-ascii 64))
    (recipient principal)
    (description (string-ascii 256))
    (approved bool)
))
```

2. **Key Functions**
- `donate`: Accept donations
- `add-spending-category`: Create new spending categories
- `propose-expenditure`: Create spending proposals
- `approve-expenditure`: Execute approved expenditures

## Usage

### Making Donations

```clarity
;; Minimum donation is 0.1 STX
(contract-call? .political-donation donate)
```

### Managing Spending Categories

```clarity
;; Add a new spending category (contract owner only)
(contract-call? .political-donation add-spending-category "Advertising")
```

### Managing Expenditures

```clarity
;; Propose an expenditure
(contract-call? .political-donation propose-expenditure 
    u1000000 ;; amount in microSTX
    "Advertising" ;; category
    'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM ;; recipient
    "Billboard Campaign" ;; description
)

;; Approve an expenditure
(contract-call? .political-donation approve-expenditure u0)
```

## Testing

The contract includes a comprehensive test suite using Vitest. To run the tests:

```bash
npm test
```

The test suite covers:
- Donation functionality
- Spending category management
- Expenditure proposal and approval
- Balance tracking
- Access control

## Deployment

1. Configure your network in `Clarinet.toml`:
```toml
[network]
name = "testnet"
deployment_fee_rate = 10
```

2. Deploy using Clarinet:
```bash
clarinet deploy --network testnet
```

## Security Considerations

1. **Access Control**
    - Only contract owner can add spending categories
    - Only contract owner can propose and approve expenditures
    - All donors must meet minimum donation threshold

2. **Fund Safety**
    - Two-step expenditure process
    - Category-based spending limits
    - Balance checks before transfers

3. **Transparency**
    - All transactions are public
    - Expenditure history is immutable
    - Real-time balance tracking

## API Reference

### Read-Only Functions

```clarity
(get-donor-info (donor principal)) -> (tuple (total-donated uint) (last-donation uint))
(get-category-info (category (string-ascii 64))) -> (tuple (allocated uint) (spent uint) (active bool))
(get-expenditure (id uint)) -> (tuple (...))
(get-balance) -> uint
```

### Public Functions

```clarity
(donate) -> (response uint uint)
(add-spending-category (category (string-ascii 64))) -> (response bool uint)
(propose-expenditure (amount uint) (category (string-ascii 64)) (recipient principal) (description (string-ascii 256))) -> (response uint uint)
(approve-expenditure (id uint)) -> (response bool uint)
```

## Error Codes

- `ERR-NOT-AUTHORIZED (u100)`: Unauthorized access attempt
- `ERR-BELOW-MINIMUM (u101)`: Donation below minimum threshold
- `ERR-INVALID-CATEGORY (u102)`: Invalid or inactive spending category
- `ERR-INSUFFICIENT-FUNDS (u103)`: Insufficient funds for expenditure

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team at [support@example.com](mailto:support@example.com).

## Roadmap

### Phase 1 (Current)
- Basic donation tracking
- Spending category management
- Expenditure control

### Phase 2 (Planned)
- Multi-signature approval
- Donor voting on expenditures
- Enhanced analytics
- Integration with campaign management tools

### Phase 3 (Future)
- Cross-chain support
- Advanced reporting
- Mobile app integration
- AI-powered spending recommendations

## Acknowledgments

- Stacks Foundation
- Clarity Language Team
- Open source contributors
