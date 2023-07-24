import React, { useEffect, useState } from "react";
import { ethers } from "ethers";

import { contractAbi, contractAddress } from "../utils/constants";

export const TransactionContext = React.createContext();

const { ethereum } = window;

const getEthereumContext = () => {
  const provider = new ethers.providers.Web3Provider(ethereum);
  const signer = provider.getSigner();
  const transactionContract = new ethers.Contract(
    contractAddress,
    contractAbi,
    signer
  );

  return transactionContract;
};

export const TransactionProvider = ({ children }) => {
  const [connectedAccount, setConnectedAccount] = useState("");
  const [formData, setFormData] = useState({
    addressTo: "",
    amount: "",
    keyword: "",
    message: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [transactionCount, setTransactionCount] = useState(
    localStorage.getItem(`transactionCount`)
  );
  const [transactions, setTransactions] = useState([]);

  const handleChange = (e, name) => {
    setFormData((prevState) => ({ ...prevState, [name]: e.target.value }));
  };

  const getAllTransaction = async () => {
    try {
      if (!ethereum) return alert("Install Metamask");
      const transactionContract = getEthereumContext();

      const availableTransactions =
        await transactionContract.getAllTransactions();

      console.log(availableTransactions);

      const structuredTransaction = availableTransactions.map(
        (transaction) => ({
          addressTo: transaction.receiver,
          addressFrom: transaction.sender,
          timestamp: new Date(
            transaction.timeStamp.toNumber * 1000
          ).toLocaleString(),
          message: transaction.message,
          keyword: transaction.keyword,
          amount: parseInt(transaction.amount._hex) * 10 ** 18,
        })
      );
      setTransactions(structuredTransaction);
    } catch (e) {
      console.log(e);
    }
  };

  const checkIfWalletIsConnected = async () => {
    try {
      if (!ethereum) return alert("Please install metamask");

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length) {
        setConnectedAccount(accounts[0]);

        getAllTransaction();
      } else {
        console.log("No Accounts Found");
      }
      console.log(accounts);
    } catch (e) {
      console.log(e);
      throw new Error("no ethereum object found");
    }
  };

  const checkIfTransactionsExist = async () => {
    try {
      const transactionContract = getEthereumContext();
      const transactionCounted =
        await transactionContract.getTransactionCount();

      window.localStorage.setItem("transactionCount", transactionCounted);
    } catch (e) {
      console.log(e);
      throw new Error("no ethereum object found");
    }
  };

  const connectWallet = async () => {
    try {
      if (!ethereum) return alert("Install MetaMask");
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      setConnectedAccount(accounts[0]);
    } catch (e) {
      console.log(e);
      throw new Error("no ethereum object found");
    }
  };

  const sendTransaction = async () => {
    try {
      if (!ethereum) return alert("Install MetaMask");
      const { addressTo, amount, keyword, message } = formData;
      const transactionContract = getEthereumContext();
      const parseAmount = ethers.utils.parseEther(amount);
      await ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: connectedAccount,
            to: addressTo,
            gas: "0x5208", // 21000 GWEI
            value: parseAmount._hex,
          },
        ],
      });

      const transactionHash = await transactionContract.addToBlockchain(
        addressTo,
        parseAmount,
        message,
        keyword
      );

      console.log(transactionHash);

      setIsLoading(true);
      console.log(`Loading - ${transactionHash.hash}`);
      await transactionHash.wait();
      setIsLoading(false);
      console.log(`Success - ${transactionHash.hash}`);

      const transactionCounted =
        await transactionContract.getTransactionCount();

      setTransactionCount(transactionCounted.toNumber());
    } catch (e) {
      console.log(e);
      throw new Error("no ethereum object found");
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
    checkIfTransactionsExist();
  }, []);

  return (
    <TransactionContext.Provider
      value={{
        connectWallet,
        connectedAccount,
        handleChange,
        formData,
        setFormData,
        sendTransaction,
        isLoading,
        transactions,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};
