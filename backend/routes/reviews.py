from flask import Blueprint, request, jsonify
from pymongo import MongoClient
from bson import ObjectId
from ml_model.model_predict import predict_review
import config

client = MongoClient(config.MONGO_URI)
db = client["reviewshield_ai"]

reviews_bp = Blueprint("reviews_bp", __name__)

@reviews_bp.route("/", methods=["GET"])
def get_verified_reviews():
    verified = list(db.reviews.find({"status": "genuine"}))
    for review in verified:
        review["_id"] = str(review["_id"])
    return jsonify(verified)

@reviews_bp.route("/", methods=["POST"])
def submit_review():
    data = request.get_json()
    review_text = data.get("review")

    # Predict fake/genuine
    prediction, confidence = predict_review(review_text)

    new_review = {
        "text": review_text,
        "product_id": data.get("product_id"),
        "status": "pending" if prediction == "fake" else "genuine",
        "confidence": confidence
    }

    db.reviews.insert_one(new_review)
    return jsonify({"message": "Review submitted", "status": new_review["status"]})
