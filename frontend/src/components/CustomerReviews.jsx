import React from "react";
import StarRating from "./StarRating";

const ReviewItem = ({ review }) => (
  <div className="flex items-start gap-4 py-6 border-b border-gray-700 last:border-b-0">
    <img
      src={review.avatarUrl}
      alt={review.author}
      className="w-12 h-12 rounded-full"
    />
    <div className="flex-1">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-semibold text-white">{review.author}</h4>
          <p className="text-sm text-gray-400">{review.date}</p>
        </div>
        <StarRating rating={review.rating} />
      </div>
      <p className="mt-2 text-gray-300">{review.comment}</p>
    </div>
  </div>
);

const CustomerReviews = ({ reviews }) => (
  <div>
    <h2 className="text-3xl font-bold text-white mb-6">Customer Reviews</h2>
    <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
      {reviews.length ? (
        reviews.map((review) => <ReviewItem key={review.id} review={review} />)
      ) : (
        <p className="text-gray-400">No reviews yet.</p>
      )}
    </div>
  </div>
);

export default CustomerReviews;
