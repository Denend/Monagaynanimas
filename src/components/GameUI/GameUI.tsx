import React from 'react';
import { GameUIProps } from '../../types.ts';
import './GameUI.css';

const GameUI: React.FC<GameUIProps> = ({
  killCount,
  buffTimerValue,
  soundBtnLabelOn,
  onSoundToggle,
  onStopGame
}) => {
  return (
    <>
      <div className="game-ui-list">
        <div className="game-ui">
          <div className="ui-counter">
            <span className="counter-label">Kills:</span>
            <span className="counter-value">{killCount}</span>
          </div>
        </div>
      </div>

      <div className="game-ui-list game-ui-list-bottom">
        <div className="game-ui">
          <div className="ui-counter">
            <span className="counter-label">Control: </span>
            <span className="counter-value">WASD</span>
          </div>
        </div>
        <div className="game-ui">
          <div className="ui-counter">
            <span className="counter-label">Shoot: </span>
            <span className="counter-value">LM</span>
          </div>
        </div>
        {buffTimerValue ? (
          <div className="game-ui">
            <div className="ui-counter">
              <span className="counter-label">Buff: </span>
              <span className="counter-value">{buffTimerValue}</span>
            </div>
          </div>
        ) : null}
        <div className="ui-counter">
          <button onClick={onSoundToggle}>
            <span className="counter-label">
              {soundBtnLabelOn ? "Disable sounds" : "Enable sounds"}
            </span>
          </button>
        </div>
        <div className="ui-counter">
          <button onClick={onStopGame}>
            <span className="counter-label">
              Stop
            </span>
          </button>
        </div>
      </div>
    </>
  );
};

export default GameUI; 