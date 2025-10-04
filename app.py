from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime

app = Flask(__name__)
CORS(app)

# MongoDB configuration - with your actual password
MONGODB_URI = "mongodb+srv://stepcounteruser:Oro20028@cluster0.pqoos8x.mongodb.net/stepcounter?retryWrites=true&w=majority&appName=Cluster0"

print(f"Connecting to MongoDB...")

try:
    client = MongoClient(MONGODB_URI)
    # Test the connection
    client.admin.command('ping')
    print("✅ Successfully connected to MongoDB!")
    
    db = client.stepcounter
    steps_collection = db.steps
    print("✅ Database and collection ready!")
    
except Exception as e:
    print(f"❌ MongoDB connection failed: {e}")
    exit(1)

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'Step Counter API is running'})

@app.route('/api/steps', methods=['POST'])
def add_step_data():
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or 'step_count' not in data or 'timestamp' not in data:
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Add server timestamp and process data
        step_record = {
            'device_id': data.get('device_id', 'android_device_001'),
            'step_count': int(data['step_count']),
            'client_timestamp': data['timestamp'],
            'server_timestamp': datetime.utcnow().isoformat(),
            'date': datetime.utcnow().strftime('%Y-%m-%d')
        }
        
        # Insert into database
        result = steps_collection.insert_one(step_record)
        
        return jsonify({
            'message': 'Step data added successfully',
            'id': str(result.inserted_id)
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/steps', methods=['GET'])
def get_step_data():
    try:
        # Get query parameters
        device_id = request.args.get('device_id', 'android_device_001')
        
        # Query database
        steps_data = list(steps_collection.find(
            {'device_id': device_id},
            {'_id': 0, 'step_count': 1, 'client_timestamp': 1, 'server_timestamp': 1}
        ).sort('server_timestamp', 1))
        
        return jsonify({
            'device_id': device_id,
            'count': len(steps_data),
            'data': steps_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    try:
        device_id = request.args.get('device_id', 'android_device_001')
        
        # Get all steps for this device
        all_steps = list(steps_collection.find({'device_id': device_id}))
        
        total_steps = sum(step['step_count'] for step in all_steps) if all_steps else 0
        
        return jsonify({
            'device_id': device_id,
            'total_steps': total_steps,
            'records_count': len(all_steps)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting Flask server...")
    app.run(host='0.0.0.0', port=5000, debug=True)