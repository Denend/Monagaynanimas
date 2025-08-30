import React from 'react';

interface FaucetModalProps {
  onClose: () => void;
  onFaucet: () => void;
}

const FaucetModal: React.FC<FaucetModalProps> = ({ onClose, onFaucet }) => {
  return (
    <div 
      onClick={onClose}
      style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        width: '1200px',
        height: '900px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          position: 'relative', 
          backgroundColor: 'rgb(131 102 235)', 
          padding: '40px 38px  20px 38px ', 
          borderRadius: '10px',
          width: '500px',
          minHeight: '550px',
          margin: '0 auto',
          backgroundImage: 'url(/logo_2.png)',
          backgroundSize: 'contain',
          backgroundPosition: 'center 15px',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <button 
          onClick={onClose}
          style={{ 
            position: 'absolute', 
            top: '5px', 
            right: '5px',
            background: 'none',
            border: 'none',
            color: '#fff',
            fontSize: '20px',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>
        
        <p style={{ color: '#fff', marginBottom: '450px', marginTop: '12px', textAlign: 'center', fontSize: '24px', fontWeight: 'bold' }}>
          We recommend using the Faucet to play <br /> on-chain. 
        </p>
        <span style={{ fontSize: '15px', display: 'block', color: '#fff', fontWeight: 'bold', letterSpacing: '0.05em', textAlign: 'center' }}>
          You can get 0.1 MON right now, and 1 MON after you kill 20+ gaynanimals in total
        </span>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: "20px" }}>
          <button 
            onClick={onFaucet}
            style={{ 
              padding: '10px 20px',
              backgroundColor: 'white',
              color: '#6e54ff',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginTop: 'auto'
            }}
          >
            Faucet
          </button>
        </div>
      </div>
    </div>
  );
};

export default FaucetModal;


