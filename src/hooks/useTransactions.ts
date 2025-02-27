import { useState, useEffect } from 'react';
import { CONFIG } from '../game/config.ts';
import { Transaction, UseTransactionsReturn, UpdateTransactionCallback, LeaderboardResponse } from '../types.ts';

export const useTransactions = (): UseTransactionsReturn => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const savedTransactions = localStorage.getItem("transactions");
    if (!savedTransactions) return [];
  
    let parsedTransactions = JSON.parse(savedTransactions);
  
    parsedTransactions = parsedTransactions.map(tx => 
      (!tx.link || tx.link === "Pending...") ? { ...tx, link: "Not processed" } : tx
    );
  
    localStorage.setItem("transactions", JSON.stringify(parsedTransactions));
    return parsedTransactions;
  });

  useEffect(() => {
    localStorage.setItem("transactions", JSON.stringify(transactions));
  }, [transactions]);

  const updateTransactions = (transaction: Transaction, callback: UpdateTransactionCallback) => {
    const { id, type } = transaction;
    
    setTransactions(prev => {
      const updated = [transaction, ...prev];
      if (updated.length > CONFIG.MAX_TRANSACTIONS) {
        updated.length = CONFIG.MAX_TRANSACTIONS;
      }
      localStorage.setItem("transactions", JSON.stringify(updated));
      return updated;
    });

    callback()
      .then((data: LeaderboardResponse) => {
        setTransactions(prev => {
          const updatedTransactions = prev.map(tx =>
            tx.id === id && tx.type === type
              ? { ...tx, link: data?.url || "Error", date: Date.now() }
              : tx
          );
          localStorage.setItem("transactions", JSON.stringify(updatedTransactions));
          return updatedTransactions;
        });
      })
      .catch(() => {
        setTransactions(prev => {
          const updatedTransactions = prev.map(tx =>
            tx.id === id && tx.type === type
              ? { ...tx, link: "Error", date: Date.now() }
              : tx
          );
          localStorage.setItem("transactions", JSON.stringify(updatedTransactions));
          return updatedTransactions;
        });
      });
  };

  const handleMint = (killCount: number) => {
    const transaction: Transaction = {
      id: Date.now(),
      type: `Mint: ${killCount}`,
      link: "Pending...",
      date: Date.now()
    };

    updateTransactions(transaction, () => import('../game/utils.ts').then(m => m.mint()));
  };

  const handleTotalScore = (score: number, isDead = false) => {
    const transaction: Transaction = {
      id: Date.now(),
      type: isDead ? `Death: ${score}` : `Kill: ${score}`,
      link: "Pending...",
      date: Date.now()
    };

    updateTransactions(transaction, () => 
      import('../game/utils.ts').then(m => m.sendTransaction(score, isDead))
    );
  };

  return {
    transactions,
    handleMint,
    handleTotalScore
  };
}; 