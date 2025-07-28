import React, { useState } from "react";
import timeSlot from "../timeSlot.json";
import { useLocation, useNavigate } from "react-router-dom";

const TimeSlot = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userDetails = location.state;
  const [selectedSlot, setSelectedSlot] = useState(null);

  const handleSelect = (id) => {
    setSelectedSlot(id);
  };

  // localStorage.removeItem("selectedTimeSlot");
  const handleConfirm = () => {
    if (selectedSlot) {
      const selectedTime = timeSlot.find((slot) => slot.id === selectedSlot);
      const newEntry = {
        id: selectedTime.id,
        dateTime: selectedTime.dateTime,
        userId: userDetails.userId,
        userName: userDetails.name,
      };

      let existingData = JSON.parse(localStorage.getItem("selectedTimeSlot"));

      if (existingData && !Array.isArray(existingData)) {
        existingData = [existingData];
      } else if (!existingData) {
        existingData = [];
      }

      existingData.push(newEntry);
      localStorage.setItem("selectedTimeSlot", JSON.stringify(existingData));

      alert(
        `Your slot is booked at ${selectedTime.dateTime}.\nPlease logout from the app.`
      );

      setSelectedSlot(null);
      navigate("/firstPage"); // FIXED: route must match your routes config
    } else {
      alert("Please select a time slot first.");
    }
  };

  const handleLogout = () => {
    navigate("/");
  };

  const bookedSlots = JSON.parse(localStorage.getItem("selectedTimeSlot")) || [];

  // Get only the slots booked by current user
  const userBookedSlotIds = bookedSlots
    .filter((entry) => entry.userId === userDetails.userId)
    .map((entry) => entry.id);

  const isSlotBookedByAnyone = (slotId) => {
    return bookedSlots.some((entry) => entry.id === slotId);
  };

  const styles = {
    wrapper: {
      maxWidth: "800px",
      margin: "40px auto",
      padding: "30px",
      backgroundColor: "#ffffff",
      borderRadius: "12px",
      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
      fontFamily: "Segoe UI, sans-serif",
      position: "relative",
    },
    logoutContainer: {
      position: "absolute",
      top: "20px",
      right: "30px",
    },
    logoutButton: {
      padding: "10px 18px",
      fontSize: "14px",
      backgroundColor: "#fff",
      color: "#1c3681",
      border: "2px solid #1c3681",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: "bold",
      transition: "all 0.3s ease",
    },
    userCard: {
      backgroundColor: "#e8f0fe",
      padding: "15px 20px",
      borderRadius: "8px",
      marginBottom: "30px",
      textAlign: "left",
      color: "#1a237e",
    },
    title: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "#1c3681",
      marginBottom: "20px",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "20px",
    },
    card: (isSelected, isBooked) => ({
      padding: "15px",
      border: isSelected ? "2px solid #1c3681" : "2px solid #ccc",
      borderRadius: "10px",
      textAlign: "center",
      backgroundColor: isBooked
        ? "#ddd"
        : isSelected
        ? "#1c3681"
        : "#f9f9f9",
      color: isBooked ? "#888" : isSelected ? "#fff" : "#333",
      cursor: isBooked ? "not-allowed" : "pointer",
      fontWeight: 500,
    }),
    confirmButton: {
      marginTop: "30px",
      padding: "12px 25px",
      fontSize: "16px",
      backgroundColor: "#1c3681",
      color: "#fff",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
    },
  };

  if (!userDetails) {
    return (
      <div style={styles.wrapper}>
        <p style={{ color: "red", fontWeight: "bold" }}>
          Invalid Access: User not logged in.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      {/* Logout Button */}
      <div style={styles.logoutContainer}>
        <button style={styles.logoutButton} onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* User Info */}
      <div style={styles.userCard}>
        <p>
          <strong>User ID:</strong> {userDetails.userId}
        </p>
        <p>
          <strong>Name:</strong> {userDetails.name}
        </p>
      </div>

      <h2 style={styles.title}>Choose Your Time Slot</h2>

      <div style={styles.grid}>
        {timeSlot.map((slot) => {
          const isBooked = isSlotBookedByAnyone(slot.id);
          const isSelected = selectedSlot === slot.id;

          return (
            <div
              key={slot.id}
              style={styles.card(isSelected, isBooked)}
              onClick={() => {
                if (!isBooked) handleSelect(slot.id);
              }}
            >
              {slot.dateTime} {isBooked ? "(Booked)" : ""}
            </div>
          );
        })}
      </div>

      <button style={styles.confirmButton} onClick={handleConfirm}>
        Confirm Time Slot
      </button>
    </div>
  );
};

export default TimeSlot;
