import sys
import os

# Add the backend directory to python path so that FastAPI app packages can be imported
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.join(current_dir, "..", "backend")
sys.path.append(parent_dir)

from app.main import app
