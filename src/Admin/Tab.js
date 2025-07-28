import { useEffect, useState } from 'react';

const Tab = () => {
  const [isTabActive, setIsTabActive] = useState(true);

  const x = isTabActive ? 'yes' : 'no';

  console.log("x",x);

  if(x==='yes')
  {
    console.log("same page")
  }
  else{
    alert("logging out of exam");
  }

  useEffect(() => {
    const handleWindowChange = () => {
      setIsTabActive(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', handleWindowChange);

    return () => {
      document.removeEventListener('visibilitychange', handleWindowChange);
    };
  }, []);

  return (
    <div>
      <h2>Tab Active: {isTabActive ? 'Yes' : 'No'}</h2>
     
    </div>
  );
};

export default Tab;
