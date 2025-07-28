import React from 'react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const handleSlotBooking = () => {
 
    navigate('/firstPage');
  };

  const handleCreateQuestions = () => {
    navigate('/questions');

  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Admin Dashboard</h1>
      <div style={styles.buttonGroup}>
        <button onClick={handleSlotBooking} style={styles.button}>
          📅 Slot Booking
        </button>
        <button onClick={handleCreateQuestions} style={styles.button}>
          📝 Create Questions
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    height: '100vh',
    backgroundColor: '#f4f6f9',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: 'Segoe UI, sans-serif',
  },
  title: {
    fontSize: '2rem',
    color: '#1c3681',
    marginBottom: '40px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '20px',
  },
  button: {
    padding: '15px 30px',
    backgroundColor: '#1c3681',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
};

export default AdminDashboard;
