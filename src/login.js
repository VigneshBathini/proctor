import React, { useState } from "react";
import details from './info.json'; 
import { useNavigate,} from "react-router-dom";

const Login = () => {
    const navigate = useNavigate();
  const [name, setName] = useState('');
  const [role, setRole] = useState('');

  const handleLogin = () => {
  const userDetails = details.find(
    (user) => user.name.toLowerCase() === name.toLowerCase()
  );

  if (!userDetails) {
    alert("User not found");
    return;
  }

  if (userDetails.role === "admin") {
    navigate("admindashboard");
  }
   else {
           const getSubmittedStudent= JSON.parse(localStorage.getItem("Result")) || [];
           console.log("getSubmittedStudent",getSubmittedStudent);
           
           const alreadyStudentExists = getSubmittedStudent.find((item)=>item.id ===userDetails.id);
          if(alreadyStudentExists)
          {
            alert("You’ve already completed this exam. No further access allowed.")
          }
          else
          navigate("studentDashboard", { state: userDetails });
   }
  
};


  const containerStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    backgroundColor: "#f4f4f4",
    fontFamily: "Arial, sans-serif"
  };

  const formStyle = {
    background: "white",
    padding: "30px",
    borderRadius: "10px",
    boxShadow: "0px 0px 10px rgba(0,0,0,0.1)",
    width: "300px"
  };

  const inputStyle = {
    width: "100%",
    padding: "10px",
    marginBottom: "15px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    fontSize: "16px"
  };

  const buttonStyle = {
    width: "100%",
    padding: "10px",
    backgroundColor: "#1c3681",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "16px"
  };

  const labelStyle = {
    marginBottom: "5px",
    fontWeight: "bold"
  };

  return (
    <div style={containerStyle}>
      <div style={formStyle}>
        <div>
          <label style={labelStyle}>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />
        </div>

        <button onClick={handleLogin} style={buttonStyle}>Login</button>

      </div>
    </div>
  );
};

export default Login;
