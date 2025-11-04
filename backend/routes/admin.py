from flask import Blueprint, jsonify, request
from pymongo import MongoClient
import config

client = MongoClient(config.MONGO_URI)
db = client["reviewshield_ai"]

admin_bp = Blueprint("admin_bp", __name__)

@admin_bp.route("/flagged", methods=["GET"])
def get_flagged_reviews():
    flagged = list(db.reviews.find({"status": "pending"}))
    for r in flagged:
        r["_id"] = str(r["_id"])
    return jsonify(flagged)

@admin_bp.route("/verify/<review_id>", methods=["PUT"])
def verify_review(review_id):
    action = request.json.get("action")
    db.reviews.update_one(
        {"_id": review_id},
        {"$set": {"status": action}}
    )
    return jsonify({"message": f"Review marked as {action}"})
