const hre = require("hardhat");
const { ethers } = require('ethers');

const erc721 = require("../exchange-dapp/src/artifacts/31337/@openzeppelin/contracts/token/ERC721/IERC721.sol/IERC721.json").abi;

async function main() {
    const [borrower, lender, collateral, ..._] = await hre.ethers.getSigners();

    // Deploy LoanContract
    const loanContractFactory = await hre.ethers.getContractFactory("LoanContract");
    const loanContract = await loanContractFactory.deploy(
        [borrower.address, lender.address],
        collateral.address,
        ethers.constants.Zero,
        ethers.constants.One,
        ethers.constants.One,
        ethers.constants.Two
    );
    await loanContract.deployed();

    // Interact with LoanContract
    let redemption = await loanContract.calculateRedemption();
    console.log(redemption);

    let status = await loanContract.getStatus();
    console.log(status);

    //borrower already signed
    await loanContract.getMyLoan();

    status = await loanContract.getStatus();
    console.log(status);

    await loanContract.connect(borrower).payLoan({ value: ethers.utils.parseEther("1") });

    redemption = await loanContract.calculateRedemption();
    console.log(redemption);

    await loanContract.payLoan({ value: ethers.utils.parseUnits("1015342465753424657", "wei") });

    status = await loanContract.getStatus();
    console.log(status);

    let nftAddress = await loanContract.collateral();
    let tokenId = await loanContract.tokenId();

    let nftContract = new hre.ethers.Contract(nftAddress, erc721, borrower);
    let owner = await nftContract.ownerOf(tokenId);
    console.log("owner of nft", owner);
    await loanContract.withdrawNFTBorrower();

    owner = await nftContract.ownerOf(tokenId);
    console.log("owner of nft", owner);
}

main();
