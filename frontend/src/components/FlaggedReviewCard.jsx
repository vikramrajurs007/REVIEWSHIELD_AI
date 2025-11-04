import React, { useState } from "react";
import { FlagIcon, AlertTriangleIcon, CheckIcon, TrashIcon } from "./icons";

const API_BASE = "http://127.0.0.1:5000/api"; // Flask backend base URL

const FlaggedReviewCard = ({ review, onAction }) => {
  const [loading, setLoading] = useState(false);


  const handleApprove = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE}/admin/approve-review/${review.product_id}/${review.review_index}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) throw new Error("Failed to approve review");
      const data = await response.json();
      console.log("✅ Approved:", data);
      onAction && onAction(); // Refresh parent data
    } catch (err) {
      console.error("❌ Approve Error:", err);
    } finally {
      setLoading(false);
    }
  };


  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE}/admin/delete-review/${review.product_id}/${review.review_index}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Failed to delete review");
      const data = await response.json();
      console.log("🗑️ Deleted:", data);
      onAction && onAction(); // Refresh parent data
    } catch (err) {
      console.error("❌ Delete Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl p-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <img
  src={
    review.avatarUrl ||
    `https://placehold.co/100x100/4A5568/E0E7FF?text=${review.author
      ? review.author.charAt(0).toUpperCase()
      : "👤"}`
  }
  alt={review.author}
  className="w-12 h-12 rounded-full"
  onError={(e) => {
    e.target.onerror = null;
    e.target.src = "https://placehold.co/100x100/4A5568/E0E7FF?text=👤";
  }}
/>

          <div>
            <h4 className="font-semibold text-white">{review.author || "Anonymous"}</h4>
            <p className="text-sm text-gray-400">
              {review.review_date
                ? new Date(review.review_date).toLocaleDateString()
                : "Unknown date"}
            </p>
          </div>
        </div>

        <span className="flex items-center gap-1.5 bg-red-800 text-red-100 text-xs font-medium px-2.5 py-1 rounded-full">
          <FlagIcon />
          Flagged as Fake
        </span>
      </div>

      {/* Review Text */}
      <p className="mt-4 text-gray-300">{review.review_text}</p>

      {review.explanation && (
        <div className="mt-4 bg-gray-700 border-l-4 border-yellow-500 p-4 rounded-r-lg">
          <div className="flex items-center gap-2">
            <AlertTriangleIcon className="w-5 h-5 text-yellow-500" />
            <h5 className="font-semibold text-yellow-500">AI Explanation</h5>
          </div>
          <p className="mt-1 text-sm text-gray-300">{review.explanation}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end items-center gap-3 mt-4">
        <button
          onClick={handleApprove}
          disabled={loading}
          className="flex items-center gap-1.5 bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
        >
          <CheckIcon /> {loading ? "Processing..." : "Approve"}
        </button>

        <button
          onClick={handleDelete}
          disabled={loading}
          className="flex items-center gap-1.5 bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-800 disabled:opacity-50"
        >
          <TrashIcon /> Delete
        </button>
      </div>
    </div>
  );
};

export default FlaggedReviewCard;
 