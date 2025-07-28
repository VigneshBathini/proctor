import React, { useState, useEffect } from "react";
import StudentData from "../studentsinfo";
import { useNavigate } from "react-router-dom";

const FirstPage = () => {
  const nav = useNavigate();
  const [list, setList] = useState([]);
  const [bookedUserIds, setBookedUserIds] = useState([]);

  useEffect(() => {
    const storedSlots = JSON.parse(localStorage.getItem("selectedTimeSlot")) || [];
    const ids = storedSlots.flatMap(entry => entry.userId);
    setBookedUserIds(ids);
  }, []);

  const handleCheck = (user) => {
    setList(prev =>
      prev.includes(user.id)
        ? prev.filter(id => id !== user.id)
        : [...prev, user.id]
    );
  };

  const handleChooseSlot = () => {
    if (list.length === 0) {
      alert("Please select at least one student.");
    } else {
      nav("atimeslot", { state: list });
    }
  };

  const styles = {
    container: {
      maxWidth: "700px",
      margin: "50px auto",
      padding: "40px",
      backgroundColor: "#f4f7fa",
      borderRadius: "16px",
      boxShadow: "0 4px 25px rgba(0,0,0,0.1)",
      fontFamily: "'Segoe UI', sans-serif"
    },
    heading: {
      fontSize: "30px",
      fontWeight: "700",
      color: "#1c3681",
      textAlign: "center",
      marginBottom: "30px"
    },
    studentCard: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: "#fff",
      padding: "20px",
      borderRadius: "10px",
      boxShadow: "0 1px 8px rgba(0,0,0,0.05)",
      marginBottom: "16px",
      transition: "all 0.2s ease-in-out"
    },
    label: {
      display: "flex",
      alignItems: "center",
      gap: "15px",
      fontSize: "17px",
      color: "#333",
      fontWeight: "500"
    },
    email: {
      color: "#888",
      fontSize: "14px"
    },
    completed: {
      color: "#27ae60",
      fontWeight: "600"
    },
    button: {
      width: "100%",
      marginTop: "25px",
      padding: "14px",
      fontSize: "16px",
      fontWeight: "600",
      backgroundColor: "#1c3681",
      color: "#fff",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      transition: "background 0.3s"
    },
    logout: {
      position: "absolute",
      top: "20px",
      right: "20px",
      backgroundColor: "#e74c3c",
      color: "#fff",
      padding: "10px 16px",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "14px",
    }
  };

  return (
    <div style={styles.container}>
      <button onClick={() => nav('/')} style={styles.logout}>
        Logout
      </button>

      <h1 style={styles.heading}> Select Students for Slot Booking</h1>

      {StudentData.map(user => (
        <div key={user.id} style={styles.studentCard}>
          <label htmlFor={`user-${user.id}`} style={styles.label}>
            <input
              type="checkbox"
              id={`user-${user.id}`}
              checked={list.includes(user.id)}
              onChange={() => handleCheck(user)}
              disabled={bookedUserIds.includes(user.id)}
            />
            <span>
              {user.name}
              <div style={styles.email}>{user.email}</div>
            </span>
          </label>
          {bookedUserIds.includes(user.id) && (
            <span style={styles.completed}> Completed</span>
          )}
        </div>
      ))}

      <button style={styles.button} onClick={handleChooseSlot}>
        Proceed to Slot Selection
      </button>
    </div>
  );
};

export default FirstPage;
