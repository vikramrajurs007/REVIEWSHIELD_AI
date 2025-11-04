import joblib
from utils.text_preprocessing import clean_text
from scipy.sparse import hstack
import pandas as pd

# Load model, vectorizer, and scaler
model = joblib.load("ml_model/reviewshield_model.pkl")
vectorizer = joblib.load("ml_model/tfidf_vectorizer.pkl")
scaler = joblib.load("ml_model/num_scaler.pkl")

def process_review(data):
    """
    data should be a dictionary like:
    {
        "review_text": "Great product!",
        "rating": 5,
        "review_length": 3,
        "sentiment_score": 0.8
    }
    """
    # Clean text
    cleaned = clean_text(data["review_text"])

    # TF-IDF features
    text_tfidf = vectorizer.transform([cleaned])

    # Numeric features as DataFrame
    num_features = pd.DataFrame([{
        "rating": data["rating"],
        "review_length": data["review_length"],
        "sentiment_score": data["sentiment_score"]
    }])

    # Scale numeric data
    num_scaled = scaler.transform(num_features)

    # Combine text + numeric features
    combined_features = hstack([text_tfidf, num_scaled])

    # Predict
    prediction = model.predict(combined_features)[0]

    return {
        "text": data["review_text"],
        "prediction": "Fake" if prediction == "fake" else "Genuine"
    }
