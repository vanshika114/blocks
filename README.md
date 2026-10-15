# 🔐 CertifyX
### Blockchain-Powered Certificate Verification

**CertifyX** is a blockchain-based certificate verification platform designed to make academic and professional credentials more secure, transparent, and tamper-resistant. It aims to simplify certificate authentication by allowing institutions to issue digital certificates and enabling anyone to verify their authenticity without relying entirely on centralized databases.

By combining blockchain technology, cryptographic hashing, and a lightweight web interface, CertifyX aims to reduce certificate forgery and build trust in digital credentials.

---

## ✨ Key Features

- 🔏 **Tamper-Resistant Verification:** Generate a unique SHA-256 hash for each certificate and record its verification data on the blockchain.
- 🎓 **Digital Certificate Issuance:** Enable authorized institutions to issue and register certificates digitally.
- 🔍 **Instant Verification:** Verify a certificate by comparing its computed hash against the recorded certificate hash.
- 🚫 **Certificate Revocation:** Allow authorized issuers to revoke certificates when necessary.
- 🔗 **Blockchain Transparency:** Use on-chain records to support transparent and independently verifiable certificate validation.
- 🛡️ **Privacy-Focused Design:** Keep certificate PDFs and personal information off-chain while storing verification-related data on-chain.
- 📊 **Lightweight Data Management:** Use Google Sheets and Google Apps Script for supporting application data management.

## 🎯 Problem Statement

Traditional certificate verification often involves manual checks, centralized databases, administrative delays, and the risk of forged or altered documents.

CertifyX aims to address these challenges by introducing a blockchain-backed verification mechanism that makes certificate integrity easier to check and unauthorized alterations easier to detect.

## 💡 How It Works

1. **Issue:** An authorized institution submits certificate details through the platform.
2. **Hash:** The system generates a SHA-256 hash from the certificate or its defined verification data.
3. **Register:** The certificate hash and relevant metadata are recorded on the blockchain.
4. **Verify:** A user uploads a certificate or provides its verification identifier.
5. **Compare:** The system computes the submitted certificate's hash and compares it with the registered record.
6. **Validate:** The platform reports whether the certificate matches a valid, recorded, and non-revoked entry.

A matching hash supports the integrity of the verified file. It does not independently prove that the original issuer was legitimate, so issuer authorization is an important part of the design.

## 🏗️ Technology Stack

| Technology | Purpose |
|---|---|
| React + Vite | Frontend application |
| TypeScript | Type-safe development |
| Tailwind CSS | Responsive user interface |
| Solidity | Smart contract development |
| Hardhat | Smart contract compilation, testing, and deployment |
| ethers.js | Blockchain interaction |
| MetaMask | Wallet connectivity |
| SHA-256 | Certificate integrity verification |
| Ethereum-compatible testnet | Planned blockchain deployment |
| Google Apps Script | Backend endpoints and application logic |
| Google Sheets | Supporting application data storage |

*The stack describes the intended architecture. Individual integrations may still be under development.*

## 🧩 System Architecture

CertifyX is designed around three primary layers:

**1. Presentation Layer**
- Certificate upload and verification interface
- Issuer dashboard
- Verification status display
- Wallet connection

**2. Application Layer**
- Certificate processing and hashing
- Request validation and authorization
- Google Apps Script endpoints
- Supporting metadata management

**3. Blockchain Layer**
- Smart contract-based certificate registration
- Certificate verification
- Issuer-controlled revocation
- On-chain verification records

### Data Storage Strategy

- **On-chain:** Certificate hashes, verification identifiers, issuer information, and revocation status, subject to the final smart contract design.
- **Off-chain:** Certificate PDFs and personal information.
- **Application storage:** Supporting records and application metadata in Google Sheets.

This separation is intended to reduce unnecessary exposure of personal information and avoid storing large documents directly on the blockchain.

## 📂 Project Structure

The project is organized around separate frontend and blockchain components.

```text
CertifyX/
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── blockchain/
│   ├── contracts/
│   │   └── Counter.sol
│   ├── scripts/
│   ├── test/
│   ├── hardhat.config.ts
│   └── package.json
│
└── README.md
```

*The structure above is illustrative. Update it to match the actual repository, and replace the starter `Counter.sol` example when the certificate smart contract is implemented.*

## ⚙️ Getting Started

### Prerequisites

Install the following tools:

- [Node.js](https://nodejs.org/)
- npm
- [Git](https://git-scm.com/)
- [MetaMask](https://metamask.io/) for wallet integration when enabled

### 1. Clone the Repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd CertifyX
```

### 2. Set Up the Blockchain Environment

```bash
cd blockchain
npm install
```

Compile the existing smart contracts:

```bash
npx hardhat compile
```

Run the existing tests:

```bash
npx hardhat test
```

These commands verify the current Hardhat setup. Certificate-specific behavior requires the corresponding contracts and tests to be implemented.

### 3. Start a Local Blockchain

```bash
npx hardhat node
```

Keep this terminal running. In a separate terminal, deploy the appropriate contract using the project's configured deployment script.

### 4. Run the Frontend

Once the frontend application is configured:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL displayed by Vite in your browser.

### 5. Configure Environment Variables

Create a local `.env` file for any required configuration, such as RPC endpoints or deployment settings.

Never commit private keys, wallet seed phrases, API secrets, or other credentials to version control.

## 📜 Planned Smart Contract Functions

| Function | Description |
|---|---|
| `issueCertificate()` | Register a certificate hash and associated metadata. |
| `verifyCertificate()` | Check whether a certificate record exists and is valid. |
| `revokeCertificate()` | Revoke a certificate through an authorized issuer. |
| `getCertificate()` | Retrieve the public verification record for a certificate. |

These are planned interfaces, not a claim that the functions are already implemented. Access control, duplicate issuance prevention, and revocation rules must be enforced in the smart contract.

## 🔒 Security Considerations

CertifyX is being designed with the following principles in mind:

- Store certificate hashes rather than entire documents on-chain.
- Restrict issuance and revocation to authorized issuers.
- Validate user inputs and uploaded files.
- Avoid exposing sensitive personal information in public blockchain transactions.
- Protect credentials and application secrets.
- Test smart contracts for unauthorized access, duplicate issuance, and invalid revocation.
- Verify uploaded files using a consistent, documented hashing procedure.

**Important:** Blockchain records are generally permanent and publicly observable. Sensitive personal information should not be written to public transactions or logs.

## 🗺️ Roadmap

- [x] Initialize the Hardhat development environment.
- [x] Establish the initial smart contract testing setup.
- [ ] Build the certificate verification frontend.
- [ ] Implement certificate issuance and verification workflows.
- [ ] Develop issuer authorization and revocation logic.
- [ ] Integrate Google Sheets using Google Apps Script.
- [ ] Connect the frontend to the smart contract using ethers.js.
- [ ] Integrate MetaMask.
- [ ] Add comprehensive smart contract and integration tests.
- [ ] Deploy to an Ethereum-compatible testnet.
- [ ] Conduct security testing and prepare for production deployment.

## 🌱 Future Enhancements

- QR-code-based certificate verification
- Institution-specific issuer dashboards
- Downloadable verification reports
- Batch certificate issuance
- Verification history and audit trails
- Integration with academic institutions and recruitment platforms

## 🤝 Contributing

Contributions, suggestions, and feedback are welcome!

1. Fork the repository.
2. Create a feature branch.
3. Implement your changes and add relevant tests.
4. Commit your changes with a clear message.
5. Open a pull request describing the changes.

For smart contract contributions, include tests covering both successful operations and unauthorized or invalid requests.

## 📄 License

Choose an appropriate open-source license before publishing the project for public reuse. If you select the MIT License, add a `LICENSE` file containing the full license text.

---

### Built with 🔐 for a more trustworthy digital credential ecosystem.

**CertifyX | Verify with confidence.**
