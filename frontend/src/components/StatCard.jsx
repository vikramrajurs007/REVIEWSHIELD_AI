import React from 'react';

const StatCard = ({ stat }) => {
  // Default colors based on stat type
  let bgColor = "bg-gray-800";
  let textColor = "text-white";

  if (stat.title.toLowerCase().includes("flagged")) bgColor = "bg-red-800";
  else if (stat.title.toLowerCase().includes("fake rate")) bgColor = "bg-yellow-800";
  else if (stat.title.toLowerCase().includes("total")) bgColor = "bg-blue-800";

  return (
    <div
      className={`${bgColor} p-6 rounded-lg shadow-xl flex justify-between items-start hover:scale-105 transform transition-all duration-200`}
    >
      <div>
        <p className="text-sm font-medium text-gray-400">{stat.title}</p>
        <p className={`${textColor} text-3xl font-bold mt-1`}>{stat.value}</p>
      </div>
      {stat.icon && <div className="ml-4">{stat.icon}</div>}
    </div>
  );
};

export default StatCard;













// import React from 'react';

// const StatCard = ({ stat }) => (
//   <div className="bg-gray-800 p-6 rounded-lg shadow-xl flex justify-between items-start">
//     <div>
//       <p className="text-sm font-medium text-gray-400">{stat.title}</p>
//       <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
//     </div>
//     {stat.icon}
//   </div>
// );

// export default StatCard;
