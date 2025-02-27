import React, { useState, useEffect } from 'react';
import { getLeaderBoard } from '../../game/utils.ts';
import { LeaderboardRecord, LeaderboardPopupProps, ApiError } from '../../types.ts';

const LeaderboardPopup: React.FC<LeaderboardPopupProps> = ({ isOpen, onClose }) => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const userId = localStorage.getItem("playerId") || "Unknown";

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await getLeaderBoard();
      setLeaderboardData(data);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else if (typeof error === 'object' && error !== null) {
        const apiError = error as ApiError;
        setErrorMessage(apiError.detail);
      } else {
        setErrorMessage("Unknown error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="popup-overlay">
      <div className="popup-content" >
        <div className="popup-header">
          <h2>Leaderboard</h2>
        
          <button className="close-button" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="table-wrapper">
          <table className="transactions-table">
            <thead>
              <tr>
                <th>Place</th>
                <th>Player ID</th>
                <th>Score</th>
                <th>Transaction</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardData.map((record, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{userId === record.id ? "You!🏆" : record.id.substring(0, 30) + "..."}</td>
                  <td>{record.score}</td>
                  <td>
                    {record.tx ? (
                      <a href={record.tx} target="_blank" rel="noopener noreferrer">
                          {record.tx?.length > 60 ? record.tx?.substring(0, 60) + "..." : record.tx}
                          </a>
                    ) : (
                      "Not processed"
                    )}
                  </td>
                </tr>
              ))}
              {leaderboardData.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center' }}>
                    {errorMessage || "No transactions to display"}
                  </td>
                </tr>
              )}
              {isLoading && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center' }}>
                    Loading new transactions...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <button className="refresh-button" onClick={fetchLeaderboard} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
      </div>
    </div>
  );
};

export default LeaderboardPopup; 