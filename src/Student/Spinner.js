import React, { useState } from 'react';
import { RotatingLines } from 'react-loader-spinner';

const Spinner = () => {
    const [showSpinner,setShowSpinner] = useState(false);


    const loadSpinner = ()=>{
       setShowSpinner(!showSpinner);
    }
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <RotatingLines
        visible={showSpinner}
        height="96"
        width="96"
        color="pink"
        strokeWidth="5"
        animationDuration="0.75"
        ariaLabel="rotating-lines-loading"
      /> 
      
      <button onClick={loadSpinner}>load spinner</button>

    </div>
  );
};

export default Spinner;
