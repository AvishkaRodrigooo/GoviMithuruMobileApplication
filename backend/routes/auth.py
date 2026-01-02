from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
import datetime
from bson import ObjectId
auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.json
    fullName = data.get('fullName')
    email = data.get('email')
    phone = data.get('phone')
    password = data.get('password')

    if not all([fullName, email, password]):
        return jsonify({"error": "Missing required fields"}), 400

    db = current_app.db

    if db.users.find_one({"email": email}):
        return jsonify({"error": "User already exists"}), 400

    passwordHash = generate_password_hash(password)
    user = {
        "fullName": fullName,
        "email": email,
        "phone": phone,
        "passwordHash": passwordHash,
        "createdAt": datetime.datetime.utcnow(),
        "updatedAt": datetime.datetime.utcnow()
    }
    result = db.users.insert_one(user)
    return jsonify({"message": "User created", "userId": str(result.inserted_id)}), 201


@auth_bp.route('/signin', methods=['POST'])
def signin():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not all([email, password]):
        return jsonify({"error": "Missing email or password"}), 400

    db = current_app.db
    user = db.users.find_one({"email": email})
    if user and check_password_hash(user['passwordHash'], password):
        return jsonify({"message": "Sign in successful", "userId": str(user['_id'])}), 200
    else:
        return jsonify({"error": "Invalid email or password"}), 401
@auth_bp.route('/user/<user_id>', methods=['GET'])
def get_user(user_id):
    db = current_app.db
    user = db.users.find_one({"_id": ObjectId(user_id)}, {"passwordHash": 0})  # exclude password
    if user:
        user['_id'] = str(user['_id'])
        return jsonify(user), 200
    else:
        return jsonify({"error": "User not found"}), 404