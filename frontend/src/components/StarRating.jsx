import React from "react";
import Star from "./Star";

const StarRating = ({ rating }) => (
  <div className="flex items-center">
    {[...Array(5)].map((_, index) => {
      const starValue = index + 1;
      return (
        <Star
          key={index}
          fill={starValue <= rating ? "rgb(234 179 8)" : "none"}
          stroke={starValue <= rating ? "rgb(234 179 8)" : "currentColor"}
        />
      );
    })}
  </div>
);

export default StarRating;
