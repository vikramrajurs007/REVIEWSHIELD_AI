import React from "react";
import Star from "./Star";

const ReviewCard = ({ review }) => {
  let reviewDate = "Unknown date";
  if (review.review_date) {
    try {
      reviewDate = new Date(review.review_date).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      reviewDate = "Invalid date";
    }
  }


  const rating = Number(review.review_rating) || 0;

  const authorName = review.author || review.username || "Anonymous User";

  return (
    <div className="bg-gray-800 p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">

      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          {/* <img
            src={review.avatarUrl || "https://placehold.co/40x40/4A5568/E0E7FF?text=U"}
            alt="avatar"
            className="w-10 h-10 rounded-full border border-gray-600"
          /> */}
          <img
            src={
              `https://placehold.co/40x40/4A5568/E0E7FF?text=${
                review.author ? review.author.charAt(0).toUpperCase() : "U"
              }`
            }
            alt={review.author || "avatar"}
            className="w-10 h-10 rounded-full border border-gray-600"
          />

          <div>
            <p className="font-semibold text-white">{authorName}</p>
            {review.verified_purchase && (
              <span className="text-blue-400 text-xs">✔ Verified Purchase</span>
            )}
          </div>
        </div>
        <p className="text-gray-400 text-xs">{reviewDate}</p>
      </div>

      {/* ⭐ Rating */}
      <div className="flex items-center mb-2">
        {[...Array(5)].map((_, index) => {
          const starValue = index + 1;
          return (
            <Star
              key={index}
              className="w-5 h-5 mr-1"
              fill={rating >= starValue ? "rgb(234 179 8)" : "none"}
              stroke={rating >= starValue ? "rgb(234 179 8)" : "currentColor"}
            />
          );
        })}
      </div>

      {/* 💬 Review Text */}
      <p className="text-gray-200 mb-3">
        {review.review_text || "No review text provided."}
      </p>

      {/* 🧠 Sentiment + Label */}
      {review.label && (
        <div
          className={`inline-block px-3 py-1 rounded-md font-semibold text-sm ${
            review.label === "Genuine"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {review.label}
          {review.sentiment !== undefined
            ? ` (Score: ${review.sentiment})`
            : ""}
        </div>
      )}
    </div>
  );
};

export default ReviewCard;
