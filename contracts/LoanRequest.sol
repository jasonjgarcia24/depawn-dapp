// SPDX-License-Identifier: MIT
pragma solidity ^0.8.5;

import "./MultiSig.sol";
// import "./LoanContract.sol";
import "hardhat/console.sol";

contract LoanRequest is MultiSig {
    enum Status {
        UNDEFINED,
        EMPTY,
        MEMBERS_SET,
        COMPONENTS_SET,
        FUNDING_SET,
        COLLATERAL_SET,
        ASSETS_SET,
        COMPLETED,
        APPROVED
    }

    struct LoanStatus {
        uint256 safeId;
        address collateral;
        uint256 initialLoanValue;
        uint256 rate;
        uint64 duration;
        Status status;
    }

    mapping(address => LoanStatus[]) loanRequests;

    event DeployedLoanContract(
        address indexed _contract,
        address indexed _borrower,
        address indexed _lender,
        uint256 _required,
        uint256 _rate,
        uint64 _duration
    );

    constructor() MultiSig(2) {}

    function createLoanRequest(
        address _collateral,
        uint256 _initialLoanValue,
        uint256 _rate,
        uint64 _duration,
        address _lender
    ) public {
        require(_duration != 0, "Duration must be nonzero.");

        uint256 _safeId = safes.length;
        uint256 _loanId = loanRequests[msg.sender].length;
        _createSafe();

        // Set loan request parameters
        loanRequests[msg.sender].push();
        loanRequests[msg.sender][_loanId].safeId = _safeId;
        loanRequests[msg.sender][_loanId].collateral = _collateral;
        loanRequests[msg.sender][_loanId].initialLoanValue = _initialLoanValue;
        loanRequests[msg.sender][_loanId].rate = _rate;
        loanRequests[msg.sender][_loanId].duration = _duration;
        __setLoanStatus(_loanId);

        // Set lender
        if (_lender != address(0)) _setLender(_safeId, _lender);
    }

    function getCollateral(address _borrower, uint256 _loanId)
        external
        view
        returns (address)
    {
        return loanRequests[_borrower][_loanId].collateral;
    }

    function getInitialLoanValue(address _borrower, uint256 _loanId)
        external
        view
        returns (uint256)
    {
        return loanRequests[_borrower][_loanId].initialLoanValue;
    }

    function getRate(address _borrower, uint256 _loanId)
        external
        view
        returns (uint256)
    {
        return loanRequests[_borrower][_loanId].rate;
    }

    function getDuration(address _borrower, uint256 _loanId)
        external
        view
        returns (uint64)
    {
        return loanRequests[_borrower][_loanId].duration;
    }

    function getLender(address _borrower, uint256 _loanId)
        external
        view
        returns (address)
    {
        uint256 _safeId = loanRequests[_borrower][_loanId].safeId;
        return _getLender(_safeId);
    }

    function getSignStatus(
        address _signer,
        address _borrower,
        uint256 _loanId
    ) external view returns (bool) {
        uint256 _safeId = loanRequests[_borrower][_loanId].safeId;
        return super._getSignStatus(_safeId, _signer);
    }

    function setCollateral(uint256 _loanId, address _collateral)
        external
        onlyHasLoan(msg.sender)
        onlyBorrower(_loanId)
        onlyNotConfirmed(msg.sender, _loanId)
    {
        if (_collateral != loanRequests[msg.sender][_loanId].collateral) {
            uint256 _safeId = loanRequests[msg.sender][_loanId].safeId;
            _unsign(_safeId);

            // Borrower signs
            if (
                loanRequests[msg.sender][_loanId].rate != 0 &&
                loanRequests[msg.sender][_loanId].duration != 0
            ) {
                (bool success, ) = address(this).delegatecall(
                    abi.encodeWithSignature(
                        "sign(address,uint256)",
                        msg.sender,
                        _loanId
                    )
                );
                if (!success) {
                    // Borrower already signed off
                }
            }

            loanRequests[msg.sender][_loanId].collateral = _collateral;
        }
    }

    function setInitialLoanValue(uint256 _loanId, uint256 _initialLoanValue)
        external
        onlyHasLoan(msg.sender)
        onlyBorrower(_loanId)
        onlyNotConfirmed(msg.sender, _loanId)
    {
        if (
            _initialLoanValue !=
            loanRequests[msg.sender][_loanId].initialLoanValue
        ) {
            uint256 _safeId = loanRequests[msg.sender][_loanId].safeId;
            _unsign(_safeId);

            // Borrower signs
            if (
                loanRequests[msg.sender][_loanId].rate != 0 &&
                loanRequests[msg.sender][_loanId].duration != 0
            ) {
                (bool success, ) = address(this).delegatecall(
                    abi.encodeWithSignature(
                        "sign(address,uint256)",
                        msg.sender,
                        _loanId
                    )
                );
                if (!success) {
                    // Borrower already signed off
                }
            }

            loanRequests[msg.sender][_loanId]
                .initialLoanValue = _initialLoanValue;
        }
    }

    function setRate(uint256 _loanId, uint64 _rate)
        external
        onlyHasLoan(msg.sender)
        onlyBorrower(_loanId)
        onlyNotConfirmed(msg.sender, _loanId)
    {
        if (_rate != loanRequests[msg.sender][_loanId].rate) {
            uint256 _safeId = loanRequests[msg.sender][_loanId].safeId;
            _unsign(_safeId);

            // Borrower signs
            if (
                loanRequests[msg.sender][_loanId].rate != 0 &&
                loanRequests[msg.sender][_loanId].duration != 0
            ) {
                (bool success, ) = address(this).delegatecall(
                    abi.encodeWithSignature(
                        "sign(address,uint256)",
                        msg.sender,
                        _loanId
                    )
                );
                if (!success) {
                    // Borrower already signed off
                }
            }

            loanRequests[msg.sender][_loanId].rate = _rate;
        }
    }

    function setDuration(uint256 _loanId, uint64 _duration)
        external
        onlyHasLoan(msg.sender)
        onlyBorrower(_loanId)
        onlyNotConfirmed(msg.sender, _loanId)
    {
        if (_duration != loanRequests[msg.sender][_loanId].duration) {
            uint256 _safeId = loanRequests[msg.sender][_loanId].safeId;
            _unsign(_safeId);

            // Borrower signs
            if (
                loanRequests[msg.sender][_loanId].rate != 0 &&
                loanRequests[msg.sender][_loanId].duration != 0
            ) {
                (bool success, ) = address(this).delegatecall(
                    abi.encodeWithSignature(
                        "sign(address,uint256)",
                        msg.sender,
                        _loanId
                    )
                );
                if (!success) {
                    // Borrower already signed off
                }
            }

            loanRequests[msg.sender][_loanId].duration = _duration;
        }
    }

    /*
     *  Set the loan Lender.
     *
     *   Borrower sets the loan's lender and rates. The borrower will
     *   automatically sign off.
     */
    function setLender(
        address _lender,
        uint256 _loanId,
        uint256 _rate
    )
        external
        onlyHasLoan(msg.sender)
        onlyBorrower(_loanId)
        onlyNotConfirmed(msg.sender, _loanId)
    {
        uint256 _safeId = loanRequests[msg.sender][_loanId].safeId;

        // Set lender
        _setLender(_safeId, _lender);

        // Set loan status
        loanRequests[msg.sender][_loanId].rate = _rate;
        __setLoanStatus(_loanId);

        // Borrower signs
        if (
            loanRequests[msg.sender][_loanId].rate != 0 &&
            loanRequests[msg.sender][_loanId].duration != 0
        ) {
            (bool success, ) = address(this).delegatecall(
                abi.encodeWithSignature(
                    "sign(address,uint256)",
                    msg.sender,
                    _loanId
                )
            );
            require(success);
        }
    }

    function __setLoanStatus(uint256 _loanId) private returns (Status) {
        // Skip if APPROVED
        if (loanRequests[msg.sender][_loanId].status == Status.APPROVED) {
            return loanRequests[msg.sender][_loanId].status;
        }

        uint256 _safeId = loanRequests[msg.sender][_loanId].safeId;
        address _lender = _getLender(_safeId);

        // COMPLETED
        if (
            loanRequests[msg.sender][_loanId].collateral != address(0) &&
            loanRequests[msg.sender][_loanId].initialLoanValue != 0 &&
            loanRequests[msg.sender][_loanId].rate != 0 &&
            loanRequests[msg.sender][_loanId].duration != 0 &&
            _lender != address(0)
        ) {
            loanRequests[msg.sender][_loanId].status = Status.COMPLETED;
        }
        // ASSETS SET
        else if (
            loanRequests[msg.sender][_loanId].collateral != address(0) &&
            loanRequests[msg.sender][_loanId].initialLoanValue != 0 &&
            loanRequests[msg.sender][_loanId].rate != 0 &&
            loanRequests[msg.sender][_loanId].duration != 0 &&
            _lender != address(0)
        ) {
            loanRequests[msg.sender][_loanId].status = Status.ASSETS_SET;
        }
        // COLLATERAL SET
        else if (
            loanRequests[msg.sender][_loanId].collateral != address(0) &&
            loanRequests[msg.sender][_loanId].rate != 0 &&
            loanRequests[msg.sender][_loanId].duration != 0 &&
            _lender != address(0)
        ) {
            loanRequests[msg.sender][_loanId].status = Status.COLLATERAL_SET;
        }
        /// FUNDING SET
        else if (
            loanRequests[msg.sender][_loanId].initialLoanValue != 0 &&
            loanRequests[msg.sender][_loanId].rate != 0 &&
            loanRequests[msg.sender][_loanId].duration != 0 &&
            _lender != address(0)
        ) {
            loanRequests[msg.sender][_loanId].status = Status.FUNDING_SET;
        }
        // COMPONENTS SET
        else if (
            loanRequests[msg.sender][_loanId].rate != 0 &&
            loanRequests[msg.sender][_loanId].duration != 0 &&
            _lender != address(0)
        ) {
            loanRequests[msg.sender][_loanId].status = Status.COMPONENTS_SET;
        }
        // MEMBERS_SET
        else if (_lender != address(0)) {
            loanRequests[msg.sender][_loanId].status = Status.MEMBERS_SET;
        }
        // EMPTY
        else {
            loanRequests[msg.sender][_loanId].status = Status.EMPTY;
        }

        return loanRequests[msg.sender][_loanId].status;
    }

    function removeLender(uint256 _loanId)
        external
        onlyHasLoan(msg.sender)
        onlyBorrower(_loanId)
        onlyNotConfirmed(msg.sender, _loanId)
    {
        uint256 _safeId = loanRequests[msg.sender][_loanId].safeId;
        _removeLender(_safeId);
        loanRequests[msg.sender][_loanId].status = Status.EMPTY;
    }

    function sign(address _borrower, uint256 _loanId)
        public
        onlyNotSigned(_borrower, _loanId)
    {
        uint256 _safeId = loanRequests[_borrower][_loanId].safeId;
        bool _confirmed = _sign(_safeId);

        if (_confirmed && __setLoanStatus(_loanId) == Status.COMPLETED) {
            loanRequests[_borrower][_loanId].status = Status.APPROVED;
        }
    }

    function removeSignature(address _borrower, uint256 _loanId)
        external
        onlyHasLoan(_borrower)
        onlyNotConfirmed(_borrower, _loanId)
    {
        uint256 _safeId = loanRequests[_borrower][_loanId].safeId;
        _removeSignature(_safeId);
    }

    modifier onlyBorrower(uint256 _loanId) {
        uint256 _safeId = loanRequests[msg.sender][_loanId].safeId;
        require(
            msg.sender == safes[_safeId].signers[0],
            "You are not the borrower."
        );
        _;
    }

    modifier onlyLender(address _borrower, uint256 _loanId) {
        uint256 _safeId = loanRequests[_borrower][_loanId].safeId;
        require(
            msg.sender == safes[_safeId].signers[1],
            "You are not the lender."
        );
        _;
    }

    modifier onlyHasLoan(address _borrower) {
        require(
            loanRequests[_borrower].length > 0,
            "No loans exist for this borrower."
        );
        _;
    }

    modifier onlyNotMembersSet(uint256 _loanId) {
        require(
            loanRequests[msg.sender][_loanId].status < Status.MEMBERS_SET,
            "Members have been set."
        );
        _;
    }

    modifier onlyNotSigned(address _borrower, uint256 _loanId) {
        uint256 _safeId = loanRequests[_borrower][_loanId].safeId;
        require(
            _getSignStatus(_safeId, msg.sender) == false,
            "Only unsigned contracts can be accessed."
        );
        _;
    }

    modifier onlyNotConfirmed(address _borrower, uint256 _loanId) {
        uint256 _safeId = loanRequests[_borrower][_loanId].safeId;
        require(
            _getConfirmed(_safeId) == false,
            "Only unconfirmed contracts can be accessed."
        );
        _;
    }

    modifier onlyMatchedTerms(
        address _borrower,
        uint256 _loanId,
        uint256 _rate,
        uint64 _duration
    ) {
        require(
            _rate == loanRequests[_borrower][_loanId].rate,
            "Rate does not match."
        );
        require(
            _duration == loanRequests[_borrower][_loanId].duration,
            "Duration does not match."
        );
        _;
    }
}
