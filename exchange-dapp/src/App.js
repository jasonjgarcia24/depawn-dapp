import './App.css';
import LoanRequestForm from './components/LoanRequestForm';
import ExistingLoansForm from './components/ExistingLoansForm';

import React, { useEffect, useState } from 'react';
import env from 'react-dotenv';
import { ethers } from 'ethers';
import getProvider from './utils/getProvider';
import { config } from './utils/config.js';

const DEFAULT_LOAN_REQUEST_PARAMETERS = {
  defaultNft: '0xB3010C222301a6F5479CAd8fAdD4D5C163FA7d8A',
  defaultTokenId: '7',
  defaultInitialLoanValue: '3.2',
  defaultRate: '0.02',
  defaultDuration: '24'
}

function App() {
  const [currentAccount, setCurrentAccount] = useState('');
  const [currentNetwork, setCurrentNetwork] = useState('');
  const [currentNftAddress, setCurrentNftAddress] = useState('');
  const [currentTokenId, setCurrentTokenId] = useState('');
  const [currentLoanValue, setCurrentLoanValue] = useState('');
  const [currentLoanRate, setCurrentLoanRate] = useState('');
  const [currentLoanDuration, setCurrentLoanDuration] = useState('');
  const [currentLoanLender, setCurrentLoanLender] = useState('');
  const [currentAccountLoans, setCurrentAccountLoans] = useState('');
  const [existingLoanElements, setExistingLoanElements] = useState('');

  useEffect(() => {
    checkIfWalletIsConnected()
  }, []);

  useEffect(() => {
    getAccountLoanRequests();
  }, [
    currentAccount,
    currentNetwork,
    currentNftAddress,
    currentTokenId,
    currentLoanValue,
    currentLoanRate,
    currentLoanDuration,
    currentLoanLender
  ]);

  useEffect(() => {
    renderExistingLoanElements();
  }, [currentAccountLoans]);

  /*
   * Connect Wallet Callback
   */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert('Get MetaMask -> https://metamask.io/');
        return;
      }

      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      // console.log('Connected to account: ', accounts[0]);
      setCurrentAccount(accounts[0]);

      ethereum.on('accountsChanged', async (_) => {
        await checkIfWalletIsConnected();
      });
    }
    catch (err) {
      console.log(err);
    }
  }

  /*
   * Connect Wallet State Change Function
   */
  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log('Make sure you have MetaMask!');
      return;
    }
    else {
      console.log('We have the ethereum object: ', ethereum);
    }

    // Check for an authorized account
    const accounts = await ethereum.request({ method: 'eth_accounts' });
    const account = accounts.length !== 0 ? accounts[0] : null;

    if (!!account) {
      console.log('Found an authorized account: ', account);
      setCurrentAccount(account);
    }
    else {
      console.log('No authorized account found :(');
      setCurrentAccount(null)
    }

    let chainId = await ethereum.request({ method: 'eth_chainId' });
    chainId = parseInt(chainId, 16).toString();
    setCurrentNetwork(chainId);

    console.log('Current chain ID: ', chainId);
    ethereum.on('chainChanged', handleChainChanged);

    function handleChainChanged(_chainId) {
      window.location.reload();
    }
  }

  const setLoanRequestListeners = async (loanRequestContract) => {
    // Set loan request listener
    loanRequestContract.on('SubmittedLoanRequest', async () => {
      await getAccountLoanRequests();
      console.log('LISTENER TRIGGERED!')
    });
  }

  const getSubAddress = (addrStr) => {
    return `${addrStr.slice(0, 5)}...${addrStr.slice(-4)}`;
  }

  /*
   * Get all loan request parameters for each loan submitted by user.
   */
  const getAccountLoanRequests = async () => {
    if (currentAccount === '' || currentNetwork === '') { return; }

    // Get contract
    const provider = getProvider();
    const borrower = provider.getSigner(currentAccount);
    const { loanRequestAddress, loanRequestABI } = config(currentNetwork);

    const loanRequestContract = new ethers.Contract(
      loanRequestAddress,
      loanRequestABI,
      borrower
    );

    // Get loan requests
    const loanRequests = await loanRequestContract.getLoans(currentAccount);
    const loans = loanRequests.map((loan) => {
      const { collateral, tokenId, initialLoanValue, rate, duration, lender } = loan;
      return { collateral, tokenId, initialLoanValue, rate, duration, lender };
    });

    // Set loan request parameters
    console.log('ACCOUNT LOANS: ', loans);
    setCurrentAccountLoans(loans);
  }

  /*
   * Submit Loan Request Callback
   * 
   * If all loan components are set and borrower and lender have signed off,
   * this loan request will generate a loan contract.
   * 
   */
  const submitLoanRequest = async () => {
    // Get input values
    const nft = document.getElementById('input-nft').value;
    const tokenId = ethers.BigNumber.from(document.getElementById('input-token-id').value);
    const initialLoanValue = ethers.utils.parseUnits(document.getElementById('input-initial-value').value);
    const rate = ethers.utils.parseUnits(document.getElementById('input-rate').value);
    const duration = document.getElementById('input-duration').value;
    const lenderAddress = ethers.constants.AddressZero;

    // Get contract
    const provider = getProvider();
    const borrower = provider.getSigner(currentAccount);

    const { loanRequestAddress, loanRequestABI } = config(currentNetwork);

    const loanRequestContract = new ethers.Contract(
      loanRequestAddress,
      loanRequestABI,
      borrower
    );
    await setLoanRequestListeners(loanRequestContract);

    // Create new loan request
    await loanRequestContract.createLoanRequest(
      nft,
      tokenId,
      initialLoanValue,
      rate,
      duration,
      ethers.constants.AddressZero
    );

    await getAccountLoanRequests();
  }

  const updateLoan = async (loanId) => {
    // Get input values
    const nft = document.getElementById(`input-existing-loan-nft-${loanId}`).value;
    const tokenId = ethers.BigNumber.from(document.getElementById(`input-existing-loan-token-id-${loanId}`).value);
    const initialLoanValue = ethers.utils.parseUnits(document.getElementById(`input-existing-loan-initial-value-${loanId}`).value);
    const rate = ethers.utils.parseUnits(document.getElementById(`input-existing-loan-rate-${loanId}`).value);
    const duration = document.getElementById(`input-existing-loan-duration-${loanId}`).value;

    // Get contract
    const provider = getProvider();
    const borrower = provider.getSigner(currentAccount);

    const { loanRequestAddress, loanRequestABI } = config(currentNetwork);

    const loanRequestContract = new ethers.Contract(
      loanRequestAddress,
      loanRequestABI,
      borrower
    );

    // Update parameter
    await loanRequestContract.setLoanParam(
      ethers.constants.Zero,
      "token_id",
      tokenId,
      ethers.constants.AddressZero
    );

    // Set state variables
    setCurrentNftAddress(nft);
    setCurrentTokenId(tokenId.toNumber());
    setCurrentLoanValue(ethers.utils.formatEther(initialLoanValue));
    setCurrentLoanRate(ethers.utils.formatEther(rate));
    setCurrentLoanDuration(duration);
  }

  const sponsorLoan = async () => {
    const { isDev } = config(currentNetwork);

    const provider = getProvider();
    const lender = isDev
      ? provider.getSigner(env.NFT_ACCOUNT_ADDRESS)
      : provider.getSigner(currentAccount);
    const lenderAddress = await lender.getAddress();
    // console.log('Lender address: ', lenderAddress);

    // Signoff and create new contract
    // tx = await loanRequestContract.connect(lender).sign(borrowerAddress, loanId);

    // const lenderAddress = document.getElementById('input-lender').value;
  }

  const renderExistingLoanElements = async () => {
    if (currentAccountLoans === '') { return; }

    setExistingLoanElements(currentAccountLoans.map((accountLoan, i) => {
      return (
        <ExistingLoansForm
          key={i}
          loanNumber={i + 1}
          updateFunc={updateLoan}
          {...accountLoan}
        />
      )
    }));

    return (
      <div>
        {existingLoanElements}
      </div>
    )
  }

  return (
    <div className="App">
      <div>
        <h1>DePawn</h1>
        {currentAccount
          ? (<div className="button button-connected-account">{getSubAddress(currentAccount)}</div>)
          : (<div className="button button-connect-wallet" onClick={connectWallet}>Connect Wallet</div>)
        }

        <div className="container">
          <div className="container-loan-forms">
            <div className="container-loan-request-form-master">
              <h2>Loan Requests</h2>
              <LoanRequestForm
                submitCallback={submitLoanRequest}
                funcCallback={getAccountLoanRequests}
                {...DEFAULT_LOAN_REQUEST_PARAMETERS}
              />
            </div>
            <div className="wedge"></div>
            <div className="container-loan-contracts-master">
              <h2>Existing Loans</h2>
              {!!existingLoanElements && existingLoanElements}
            </div>
          </div>
        </div>
      </div >
    </div >
  );
}

export default App;
