from flask import Flask, request, jsonify
import numpy as np
import cv2
from deepface import DeepFace

app = Flask(__name__)


@app.route("/recognize", methods=["POST"])
def recognize():
    image_bytes = request.data

    np_arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    try:
        results = DeepFace.represent(
            img_path=img, model_name="Facenet", detector_backend="opencv"
        )

        faces = []
        for r in results:
            faces.append({"embedding": r["embedding"], "face_box": r["facial_area"]})

        return jsonify({"faces": faces})

    except Exception as e:
        return jsonify({"error": str(e)})


if __name__ == "__main__":
    app.run(port=5000)