import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const StudentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userDetails = location.state;

  console.log(userDetails)

  const [disable, setDisable] = useState(true);
  const [countdown, setCountdown] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userDetails?.id) return;

    const selectedSlots = JSON.parse(localStorage.getItem("selectedTimeSlot")) || [];
    console.log("selected slots",selectedSlots);

    
    const matchedEntry = selectedSlots.find(
      entry => Array.isArray(entry.userId) && entry.userId.includes(userDetails.id)
    );

    if (!matchedEntry) {
      setError("You don't have a scheduled slot.");
      return;
    }

    const scheduledTime = new Date(`${matchedEntry.date} ${matchedEntry.time}`);
    const windowEnd = new Date(scheduledTime.getTime() + 30 * 60000); 

    const interval = setInterval(() => {
      const now = new Date();

      if (now >= scheduledTime && now <= windowEnd) {
        setDisable(false);
        setCountdown(`Time left: ${formatTime(windowEnd - now)} (until exam closes)`);
      } else if (now < scheduledTime) {
        setDisable(true);
        setCountdown(`Exam will start in: ${formatTime(scheduledTime - now)}`);
      } else {
        setDisable(true);
        setCountdown("Exam time has ended.");
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [userDetails]);

  function formatTime(ms) {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h}h ${m}m ${s}s`;
  }

  const handleStart = () => {
    navigate("/dquestions",{state :userDetails});
  };

  const styles = {
    wrapper: {
      maxWidth: "800px",
      margin: "50px auto",
      padding: "40px",
      backgroundColor: "#ffffff",
      borderRadius: "16px",
      boxShadow: "0 8px 30px rgba(0, 0, 0, 0.1)",
      fontFamily: "Segoe UI, sans-serif",
      color: "#1a237e",
    },
    title: {
      fontSize: "30px",
      fontWeight: "bold",
      marginBottom: "25px",
      textAlign: "center",
      color: "#1c3681",
    },
    userInfo: {
      fontSize: "16px",
      marginBottom: "20px",
      textAlign: "center",
      fontWeight: "500",
    },
    list: {
      paddingLeft: "20px",
      marginBottom: "30px",
      fontSize: "16px",
      lineHeight: "1.7",
    },
    button: {
      display: "block",
      margin: "0 auto",
      padding: "14px 30px",
      fontSize: "18px",
      backgroundColor: disable ? "#ccc" : "#1c3681",
      border: "none",
      borderRadius: "10px",
      cursor: disable ? "not-allowed" : "pointer",
      fontWeight: "bold",
      color: disable ? "#666" : "white",
      transition: "0.3s",
    },
    countdown: {
      textAlign: "center",
      fontSize: "18px",
      marginBottom: "20px",
      fontWeight: "600",
      color: "#d32f2f",
    },
    error: {
      color: "red",
      textAlign: "center",
      fontWeight: "bold",
    }
  };

  return (
    <div style={styles.wrapper}>
      <h2 style={styles.title}>Exam Rules & Regulations</h2>

      {error && <p style={styles.error}>{error}</p>}

      {!error && (
        <>
          <div style={styles.userInfo}>
            <p>User ID: {userDetails.id}</p>
            <p>Name: {userDetails.name}</p>
          </div>

          <ul style={styles.list}>
            <li>Be present at least 10 minutes before the start time.</li>
            <li>Mobile phones and electronic gadgets are not allowed.</li>
            <li>Once started, the exam must be completed in one sitting.</li>
            <li>Any kind of cheating or malpractice will result in disqualification.</li>
            <li>Click "Start Exam" only after your slot begins.</li>
          </ul>

          <p style={styles.countdown}>{countdown}</p>

          <button disabled={disable} style={styles.button} onClick={handleStart}>
            Start Exam
          </button>
        </>
      )}
    </div>
  );
};

export default StudentPage;
