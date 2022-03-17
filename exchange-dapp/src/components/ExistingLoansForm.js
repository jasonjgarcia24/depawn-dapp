import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import getProvider from '../utils/getProvider';
import { config } from '../utils/config.js';

const edit_emoji = "✍🏽";
const delete_emoji = "🗑️";
const cancel_emoji = "\u{274c}";

export default function ExistingLoansForm(props) {
    const [currentNftCommitStatus, setCurrentNftCommitStatus] = useState(false);
    const [currentEdit, setCurrentEdit] = useState('');
    console.log(props.currentType)

    function setEditName(name) {
        if (name === currentEdit) {
            /* If the cancel button ("❌") is hit... */
            // Restore currentEdit to default
            setCurrentEdit('');

            // Restore all inputs to defaults
            restoreVals('');
        }
        else {
            /* If the change button ("✍️") is hit... */
            // Set currentEdit to the field being editted
            setCurrentEdit(name);

            // If lender, set to address 0
            if (name === 'lender') removeLender();
        }
    }

    async function currentNftCommitStatusSetter() {
        // Get contract LoanRequest contract
        const provider = getProvider();
        const borrower = provider.getSigner(props.currentAccount);
        const { loanRequestAddress, erc721, erc1155 } = config(props.currentNetwork);

        // Get ERC721 contract
        const nftContract = new ethers.Contract(props.collateral, props.currentType === 'erc115' ? erc1155 : erc721, borrower);

        nftContract.on('Transfer', async (ev) => {
            console.log(`NFT (${props.currentType.toUpperCase()}) Transfered!`, ev)
        })

        // Identify if LoanRequest contract currently owns ERC721
        // setCurrentNftCommitStatus(nftOwner === loanRequestAddress);
    }

    useEffect(() => {
        currentNftCommitStatusSetter();
        // eslint-disable-next-line
    }, []);

    function restoreVals(exclusion) {
        const nftElement = document.getElementById("input-existing-loan-nft-" + props.loanNumber);
        const tokenIdElement = document.getElementById("input-existing-loan-token-id-" + props.loanNumber);
        const valueElement = document.getElementById("input-existing-loan-value-" + props.loanNumber);
        const rateElement = document.getElementById("input-existing-loan-rate-" + props.loanNumber);
        const durationElement = document.getElementById("input-existing-loan-duration-" + props.loanNumber);
        const lenderElement = document.getElementById("input-existing-loan-lender-" + props.loanNumber);

        if (exclusion !== "nft") nftElement.value = props.collateral;
        if (exclusion !== "token-id") tokenIdElement.value = props.tokenId;
        if (exclusion !== "value") valueElement.value = ethers.utils.formatEther(props.initialLoanValue);
        if (exclusion !== "rate") rateElement.value = ethers.utils.formatEther(props.rate);
        if (exclusion !== "duration") durationElement.value = props.duration;
        if (exclusion !== "lender") lenderElement.value = props.lender;
    }

    async function commitNft() {
        console.log('PROPS::: ', props)
        // Get contract LoanRequest contract
        const provider = getProvider();
        const borrower = provider.getSigner(props.currentAccount);
        const { loanRequestAddress, erc721, erc1155 } = config(props.currentNetwork);
        console.log(props)
        try {
            if (props.currentType === 'erc1155') {
                console.log('trying the erc1155');
                // Get ERC1155 contract
                const nftContract = new ethers.Contract(props.collateral, erc1155, borrower);

                // Transfer ERC1155 to LoanRequest contract
                await nftContract["safeTransferFrom(address,address,uint256,uint256)"](
                    props.currentAccount, loanRequestAddress, props.tokenId, ethers.constants.One
                );
                return true;
            }
            else if (props.currentType === 'erc721') {
                console.log('trying the erc721');
                // Get ERC721 contract
                const nftContract = new ethers.Contract(props.collateral, erc721, borrower);

                // Transfer ERC721 to LoanRequest contract
                await nftContract["safeTransferFrom(address,address,uint256)"](
                    props.currentAccount, loanRequestAddress, props.tokenId
                );
                return true;
            }
            else {
                console.log('Unsupported Token type.');
            }
        }
        catch (err) {
            return false;
        }
    }

    async function withdrawNft() {
        // Get contract LoanRequest contract
        const provider = getProvider();
        const borrower = provider.getSigner(props.currentAccount);
        const { loanRequestAddress, loanRequestABI } = config(props.currentNetwork);

        const loanRequestContract = new ethers.Contract(
            loanRequestAddress,
            loanRequestABI,
            borrower
        );

        // Withdraw ERC721 from LoanRequest contract
        try {
            await loanRequestContract.withdrawNFT(ethers.BigNumber.from(props.loanNumber));
            return true;
        }
        catch (err) {
            return false;
        }
    }

    function removeLender() {
        const lenderElement = document.getElementById("input-existing-loan-lender-" + props.loanNumber);
        lenderElement.value = ethers.constants.AddressZero;
    }

    return (
        <div className="container-existing-loan-form">
            <h3>Loan #{props.loanNumber + 1}</h3>

            <div className="container-existing-loan-component">
                <div className="label label-nft">NFT:</div>
                <input
                    type="string"
                    id={"input-existing-loan-nft-" + props.loanNumber}
                    className="input input-existing-loan-nft"
                    placeholder='NFT Address...'
                    defaultValue={props.collateral}
                    readOnly={currentEdit !== "nft"}>
                </input>
                <div
                    id={"edit-nft-" + props.loanNumber}
                    className="button button-edit button-edit-nft">
                </div>
            </div>

            <div className="container-existing-loan-component">
                <div className="label label-token-id">Token ID:</div>
                <input
                    type="string"
                    id={"input-existing-loan-token-id-" + props.loanNumber}
                    className="input input-existing-loan-token-id"
                    placeholder='Token ID...'
                    defaultValue={props.tokenId}
                    readOnly={currentEdit !== "token-id"}>
                </input>
                <div
                    id={"edit-token-id-" + props.loanNumber}
                    className="button button-edit button-edit-token-id">
                </div>
            </div>

            <div className="container-existing-loan-component">
                <div className="label label-value">Amount:</div>
                <input
                    type="string"
                    id={"input-existing-loan-value-" + props.loanNumber}
                    className="input input-existing-loan-value"
                    placeholder='Loan Value (ETH)...'
                    defaultValue={ethers.utils.formatEther(props.initialLoanValue)}
                    readOnly={currentEdit !== "value"}>
                </input>
                <div
                    id={"edit-value-" + props.loanNumber}
                    className="button button-edit button-edit-value"
                    onClick={() => {
                        setEditName("value");
                        restoreVals("value");
                    }}>
                    {currentEdit !== "value" ? edit_emoji : cancel_emoji}
                </div>
            </div>

            <div className="container-existing-loan-component">
                <div className="label label-rate">Rate:</div>
                <input
                    type="string"
                    id={"input-existing-loan-rate-" + props.loanNumber}
                    className="input input-existing-loan-rate"
                    placeholder='Rate...'
                    defaultValue={ethers.utils.formatEther(props.rate)}
                    readOnly={currentEdit !== "rate"}>
                </input>
                <div
                    id={"edit-rate-{props.loanNumber}"}
                    className="button button-edit button-edit-rate"
                    onClick={() => {
                        setEditName("rate");
                        restoreVals("rate");
                    }}>
                    {currentEdit !== "rate" ? edit_emoji : cancel_emoji}
                </div>
            </div>

            <div className="container-existing-loan-component">
                <div className="label label-duration">Duration:</div>
                <input
                    type="string"
                    id={"input-existing-loan-duration-" + props.loanNumber}
                    className="input input-existing-loan-duration"
                    placeholder='Duration (months)...'
                    defaultValue={props.duration}
                    readOnly={currentEdit !== "duration"}>
                </input>
                <div
                    id={"edit-duration-" + props.loanNumber}
                    className="button button-edit button-edit-duration"
                    onClick={() => {
                        setEditName("duration");
                        restoreVals("duration");
                    }}>
                    {currentEdit !== "duration" ? edit_emoji : cancel_emoji}
                </div>
            </div>

            <div className="container-existing-loan-component">
                <div className="label label-lender">Lender:</div>
                <input
                    type="string"
                    id={"input-existing-loan-lender-" + props.loanNumber}
                    className="input input-existing-loan-lender"
                    placeholder='Not set...'
                    defaultValue={!!parseInt(props.lender, 16) ? props.lender : "Unassigned 😞"}
                    readOnly>
                </input>
                <div
                    id={"edit-lender-" + props.loanNumber}
                    className="button button-edit button-edit-lender"
                    onClick={() => {
                        setEditName("lender");
                        restoreVals("lender");
                    }}>
                    {currentEdit !== "lender" ? delete_emoji : cancel_emoji}
                </div>
            </div>

            <div className="container-existing-loan-buttons">
                <div
                    id={"button-existing-loan-update-" + props.loanNumber}
                    className="button button-existing-loan button-existing-loan-commit"
                    onClick={() => {
                        if (!currentNftCommitStatus) {
                            commitNft().then((res) => { setCurrentNftCommitStatus(res); });
                        }
                        else {
                            withdrawNft().then((res) => { setCurrentNftCommitStatus(!res) })
                        }
                    }}>
                    {currentNftCommitStatus ? "Withdraw NFT" : "Commit NFT"}
                </div>
                <div
                    id={"button-existing-loan-update-" + props.loanNumber}
                    className="button button-existing-loan button-existing-loan-update"
                    onClick={() => {
                        props.updateFunc(props.loanNumber, currentEdit)
                            .then(() => { setCurrentEdit(''); });
                    }}>
                    Update
                </div>

                <div
                    id={"button-existing-loan-sign-" + props.loanNumber}
                    className={`button button - existing - loan button - existing - loan - sign ${currentNftCommitStatus ? " button-enabled" : " button-disabled"}`}>
                    Sign
                </div>
            </div>
        </div >
    )
}