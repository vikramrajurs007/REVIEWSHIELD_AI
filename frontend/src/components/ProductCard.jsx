import React from "react";
import { useNavigate } from "react-router-dom";

const ProductCard = ({ product }) => {
  const navigate = useNavigate();

  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "INR",
  }).format(product.price);

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden transform transition-all duration-300 hover:scale-105">
      <img
        className="w-full h-48 object-cover"
        src={product.imageUrl}
        alt={product.name}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src =
            "https://placehold.co/600x400/1D232A/E0E7FF?text=Image+Not+Found";
        }}
      />
      <div className="p-5">
        <h3 className="text-xl font-semibold text-white truncate">
          {product.name}
        </h3>
        <p className="text-sm text-gray-400 mt-1">{product.category}</p>
        <div className="flex justify-between items-center mt-4">
          <span className="text-lg font-bold text-white">{formattedPrice}</span>
          <button
            onClick={() => navigate(`/product/${product.id}`)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            View
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
