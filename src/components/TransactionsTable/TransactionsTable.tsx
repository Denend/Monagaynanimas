import React from 'react';
import { Transaction, TransactionsTableProps } from '../../types.ts';
import './TransactionsTable.css';

const TransactionsTable: React.FC<TransactionsTableProps> = ({ transactions }) => {
  return (
    <div className="transactions">
      <h2>Transactions {transactions.length ? `(${transactions.length})` : null}</h2>
      {transactions.length ? (
        <div className="table-wrapper">
          <table className="transactions-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Link</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, index) => (
                <tr datatype={tx.type.split(" ")[0].replace(":", "")} key={index}>
                  <td>{tx.type}</td>
                  <td>
                    {!tx.link || tx.link === "Pending..." || tx.link === "Error" || tx.link === "Not processed" ? (
                      <span>{tx.link || "Error"}</span>
                    ) : (
                      <a href={tx.link} target="_blank" rel="noopener noreferrer">
                        {tx.link?.length > 60 ? tx.link?.slice(0, 60) + "..." : tx.link || "Error"}
                      </a>
                    )}
                  </td>
                  <td>{new Date(tx.date).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <span className="regular">You have no transactions</span>
      )}
    </div>
  );
};

export default TransactionsTable; 