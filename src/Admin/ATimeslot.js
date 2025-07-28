import React, { useState, useEffect } from "react";
import moment from "moment";
import { useLocation, useNavigate } from "react-router-dom";
import { AiOutlineCaretLeft,AiFillCaretRight } from "react-icons/ai";

const ATimeSlot = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();
  const userDetails = location.state;

  useEffect(() => {
    generateSlots("10:00 am", "11:00 pm");
  }, [currentDate]);

  const generateSlots = (startTime, endTime) => {
    let start = moment(startTime, "hh:mm a");
    let end = moment(endTime, "hh:mm a");

    start.minutes(Math.ceil(start.minutes() / 30) * 30);
    let current = moment(start);
    const newSlots = [];

    while (current <= end) {
      newSlots.push(current.format("hh:mm a"));
      current.add(30, "minutes");
    }

    setSlots(newSlots);
  };

  const handleSelect = (time) => {
    setSelectedSlot(time);
  };

  const handleConfirm = () => {
    if (!selectedSlot) {
      alert("Please select a time slot.");
      return;
    }

    const newEntry = {
      date: currentDate.toDateString(),
      time: selectedSlot,
      userId: userDetails,
    };

    let existingData =
      JSON.parse(localStorage.getItem("selectedTimeSlot")) || [];

    const alreadyBooked = existingData.some(
      (item) =>
        item.date === newEntry.date && item.userId.id === userDetails.id
    );

    // if (alreadyBooked) {
    //   alert(
    //     `You have already booked a slot on ${newEntry.date}. Please choose another day.`
    //   );
    //   return;
    // }

    existingData.push(newEntry);
    localStorage.setItem("selectedTimeSlot", JSON.stringify(existingData));

    alert(`Slot booked at ${selectedSlot} on ${currentDate.toDateString()}.`);
    setSelectedSlot(null);
  };

  const handleNextDay = () => {
    const nextDay = new Date(currentDate);
    nextDay.setDate(currentDate.getDate() + 1);
    setCurrentDate(nextDay);
    setSelectedSlot(null);
    const getDayNum = nextDay.getDay();
    // console.log("getDayNum",getDayNum);
    // if(getDayNum >=5)
    // {
    // nextDay.setDate(currentDate.getDate() + 3);
    // setCurrentDate(nextDay);
    // setSelectedSlot(null);    }
    // else{
    //    nextDay.setDate(currentDate.getDate() + 1);
    // setCurrentDate(nextDay);
    // setSelectedSlot(null); 
    // }
  };

  const handlePreviousDay = () => {
    const prevDay = new Date(currentDate);
    prevDay.setDate(currentDate.getDate() - 1);
    setCurrentDate(prevDay);
    setSelectedSlot(null);
  };

  const isToday = (someDate) => {
    const today = new Date();
    return (
      someDate.getDate() === today.getDate() &&
      someDate.getMonth() === today.getMonth() &&
      someDate.getFullYear() === today.getFullYear()
    );
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
    },
    title: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "#1c3681",
      textAlign: "center",
      marginBottom: "10px",
    },
    dateText: {
      textAlign: "center",
      fontSize: "18px",
      // marginBottom: "20px",
    },
    navButtons: {
      display:'flex',
      flexDirection:'row',
      justifyContent:'center',
      alignItems:'center',
      textAlign: "center",
      marginBottom: "10px",
    },
    navButton: {
      padding: "8px 14px",
      backgroundColor: "#1c3681",
      color: "white",
      border: "none",
      borderRadius: "6px",
      margin: "0 5px",
      cursor: "pointer",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
      gap: "16px",
      marginTop: "20px",
    },
    slotCard: (isSelected) => ({
      padding: "15px",
      border: isSelected ? "2px solid #1c3681" : "2px solid #ccc",
      borderRadius: "10px",
      textAlign: "center",
      backgroundColor: isSelected ? "#1c3681" : "#f9f9f9",
      color: isSelected ? "#fff" : "#333",
      cursor: "pointer",
      transition: "all 0.2s ease-in-out",
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
      display: "block",
      marginLeft: "auto",
      marginRight: "auto",
    },
  };

  return (
    <div style={styles.wrapper}>
      <h2 style={styles.title}>Choose Your Time Slot</h2>


      <div style={styles.navButtons}>
        {!isToday(currentDate) && (
          <button style={styles.navButton} onClick={handlePreviousDay}>
<AiOutlineCaretLeft />

  </button>
        )}
      <div style={styles.dateText}>{currentDate.toDateString()}</div>

        <button style={styles.navButton} onClick={handleNextDay}>
<AiFillCaretRight />
        </button>
      </div>

      <div style={styles.grid}>
        {slots.length > 0 ? (
          slots.map((time, index) => (
            <div
              key={index}
              onClick={() => handleSelect(time)}
              style={styles.slotCard(selectedSlot === time)}
            >
              {time}
            </div>
          ))
        ) : (
          <p>No slots generated.</p>
        )}
      </div>

      <button style={styles.confirmButton} onClick={handleConfirm}>
        Confirm Time Slot
      </button>
    </div>
  );
};

export default ATimeSlot;
