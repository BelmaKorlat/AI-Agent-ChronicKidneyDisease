# AI-Agent-Chronic-Kidney-Disease

A web-based machine learning application for predicting the risk of chronic kidney disease (CKD) using clinical and laboratory parameters.  
The project includes a **Python Flask backend** for predictions, user authentication (JWT), model management, and a simple **HTML/JavaScript frontend** for entering data and displaying results.

---

## Features

- CKD risk prediction using multiple ML models (Random Forest, Logistic Regression, K-Nearest Neighbors, Support Vector Machines)
- User registration and login (secured with JWT)
- Logging of each prediction in the dataset
- Model retraining available after login
- Pre-trained model files included for immediate use
- Simple browser-based interface (no frameworks needed)
- Data cleaning script included

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/BelmaKorlat/AI-Agent-Chronic-Kidney-Disease.git
cd AI-Agent-Chronic-Kidney-Disease
```
### 2. Install backend dependencies
From the Backend folder, install required packages:
```bash
cd Backend
pip install flask flask-cors pandas scikit-learn sqlalchemy pyodbc joblib werkzeug pyjwt
```
- If you get errors for pyodbc, make sure you have ODBC Driver 17+ for SQL Server installed.

- If you use another database, update the SQLALCHEMY_DATABASE_URI in app.py accordingly.

### 3. Run the backend
```bash
python app.py
```
The backend will start on http://localhost:5000.

### 4. Run the frontend
```bash
cd Frontend
python -m http.server
```
The frontend will be available at http://localhost:8000.

---

## Usage

- Open the frontend in your browser (http://localhost:8000).

- Register or log in (JWT authentication is used; token is managed automatically).

- Enter clinical and laboratory data in the provided form.

- Select the machine learning algorithm (Random Forest, Logistic Regression, K-Nearest Neighbors, Support Vector Machines).

- Submit the form to get the CKD risk prediction and probability.

- If you wish to retrain the model with your data, login is required. After logging in, you can retrain the models directly from the interface.

---

## Notes

- Pre-trained models (.joblib files) are provided in Backend/model/.
- You can delete these files and retrain new models after logging in.
- Data files (.csv) in Backend/data/ are included for testing and demonstration purposes.
- User authentication and data are handled through SQL Server (see app.py for connection string).
- If you want to use another database or credentials, adjust the SQLALCHEMY_DATABASE_URI in app.py.
- Both backend and frontend are independent; each must be started separately as described above.

---

## License

This project is intended for educational, research, and demonstration purposes.  

---

## Contact

For questions, suggestions, or collaboration opportunities, feel free to contact me.

---

Thank you for your interest in the Chronic Kidney Disease Prediction Agent!  
I hope this project helps you discover new insights and possibilities with AI in healthcare.

---
