from flask import Flask, request, jsonify
from flask_cors import CORS
from joblib import dump, load
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
from sklearn.neighbors import KNeighborsClassifier
from sklearn.svm import SVC
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
from functools import wraps

app = Flask(__name__)
CORS(app)  
app.config['SQLALCHEMY_DATABASE_URI'] = (
    '-----------------'
)

app.config['SECRET_KEY'] = '-----------------' 
db = SQLAlchemy(app)

# Funckija za login_required 
def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'error': 'Nedostaje token!'}), 401
        try:
            jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        except Exception:
            return jsonify({'error': 'Nevažeći ili istekao token!'}), 401
        return f(*args, **kwargs)
    return decorated

# Korisnik
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(512), nullable=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

# Pravilno: create_all van klase! Pri prvom pokretanju se pokrene, a onda se zakomentariše
    # with app.app_context():
    #     db.create_all()

def evaluiraj_model(y_test, y_pred, ime_modela, dataset="Test"):
    report = classification_report(y_test, y_pred, target_names=['notckd', 'ckd'], output_dict=True)
    print(f"\n=== Evaluacija modela: {ime_modela} na {dataset} skupu ===")
    print(pd.DataFrame(report).transpose().round(2))

# Funkcija za učitavanje podataka
def ucitaj_podatke(file_path="data/ckd_cleaned_imputed.csv"):
    podaci = pd.read_csv(file_path)

    kolone = ['age', 'bp', 'bgr', 'bu', 'sc', 'hemo', 'pcv', 'sg', 'al', 'htn', 'dm', 'appet', 'classification']
    podaci = podaci[[k for k in kolone if k in podaci.columns]] 

    podaci = podaci.drop(columns=['id'], errors='ignore')  

    podaci['classification'] = podaci['classification'].map({'ckd': 1, 'notckd': 0})

    podaci = podaci[podaci['classification'].notna()]

    podaci['classification'] = podaci['classification'].astype(int)

    podaci['htn'] = podaci['htn'].map({'yes': 1, 'no': 0})
    podaci['dm'] = podaci['dm'].map({'yes': 1, 'no': 0})
    podaci['appet'] = podaci['appet'].map({'good': 1, 'poor': 0})

    return podaci

# Priprema podataka za trening
def pripremi_podatke(podaci):
 
    features = [ 'age', 'bp', 'bgr', 'bu', 'sc', 'hemo', 'pcv', 
        'sg', 'al', 'htn', 'dm', 'appet'] 
    X = podaci[features]
    y = podaci['classification']  
    
    return train_test_split(X, y, test_size=0.2, random_state=42)

# Treniranje modela
def treniraj_model(algorithm, hyperparams, X_train, y_train):
    if algorithm == "RandomForest":
        if "n_estimators" in hyperparams:
            hyperparams["n_estimators"] = int(hyperparams["n_estimators"])
        if "max_depth" in hyperparams:
            hyperparams["max_depth"] = int(hyperparams["max_depth"]) if str(hyperparams["max_depth"]).strip() != "" else None
    elif algorithm == "KNearestNeighbors":
        if "n_neighbors" in hyperparams:
            hyperparams["n_neighbors"] = int(hyperparams["n_neighbors"])
    elif algorithm == "LogisticRegression":
        if "C" in hyperparams:
            hyperparams["C"] = float(hyperparams["C"])
        if "max_iter" in hyperparams:
            hyperparams["max_iter"] = int(hyperparams["max_iter"])
    elif algorithm == "SupportVectorMachines":
        if "C" in hyperparams:
            hyperparams["C"] = float(hyperparams["C"])

    # Treniranje odabranog modela s proslijeđenim hiperparametrima
    if algorithm == "RandomForest":
        model = RandomForestClassifier(
            n_estimators=hyperparams.get("n_estimators", 100),
            max_depth=hyperparams.get("max_depth", None),
            random_state=42,
            class_weight="balanced"
        )
    elif algorithm == "LogisticRegression":
        model = LogisticRegression(
            C=hyperparams.get("C", 1.0),
            max_iter=hyperparams.get("max_iter", 1000),
            solver="lbfgs"
        )
    elif algorithm == "KNearestNeighbors":
        model = KNeighborsClassifier(
            n_neighbors=hyperparams.get("n_neighbors", 5)
        )
    elif algorithm == "SupportVectorMachines":
        model = make_pipeline(
            StandardScaler(),
            SVC(
                C=hyperparams.get("C", 1.0),
                kernel=hyperparams.get("kernel", "rbf"),
                probability=True,
                random_state=42
            )
        )
    else:
        raise ValueError("Nepoznat algoritam!")

    model.fit(X_train, y_train)
    return model

# Funkcija za predviđanje
def predvidi(age, bp, bgr, bu, sc, hemo, pcv, sg, al, htn, dm, appet, algorithm="RandomForest"):
    # Mapa imena fajlova
    filename_map = {
    "RandomForest": "model/kidney_disease_model.joblib",
    "LogisticRegression": "model/kidney_disease_lr.joblib",
    "KNearestNeighbors": "model/kidney_disease_knn.joblib",
    "SupportVectorMachines": "model/kidney_disease_svm.joblib"
    }

    # Uskladi frontend i backend vrijednosti!
    filename = filename_map.get(algorithm, "model/kidney_disease_model.joblib")
    print(f"[PREDIKCIJA] Učitavam model iz fajla: {filename}")
    model = load(filename)

    ulaz = pd.DataFrame([{
        'age': float(age),
        'bp': float(bp),
        'bgr': float(bgr),
        'bu': float(bu),
        'sc': float(sc),
        'hemo': float(hemo),
        'pcv': float(pcv),
        'sg': float(sg),
        'al': float(al),
        'htn': 1 if htn == "yes" else 0,
        'dm': 1 if dm == "yes" else 0,
        'appet': 1 if appet == "good" else 0
    }])
    predikcija = model.predict(ulaz)[0]
    vjerovatnoce = model.predict_proba(ulaz)[0]
    return predikcija, vjerovatnoce

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    username = data.get('username')
    password = data.get('password')

    if not username or not password or not first_name or not last_name:
        return jsonify({'error': 'Sva polja su obavezna.'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Korisničko ime već postoji.'}), 400

    new_user = User(
        username=username,
        first_name=first_name,
        last_name=last_name
    )
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': 'Registracija uspješna!'})

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    user = User.query.filter_by(username=username).first()

    if user and user.check_password(password):
        token = jwt.encode(
            {'user_id': user.id, 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=2)},
            app.config['SECRET_KEY'],
            algorithm='HS256'
        )
        return jsonify({'token': token, 'username': username})
    else:
        return jsonify({'error': 'Pogrešno korisničko ime ili lozinka!'}), 401

@app.route('/predvidi', methods=['POST'])
def api_predvidi():
    try:
        podaci = request.json
        algorithm = podaci.get('algorithm', 'RandomForest')  # default RandomForest

        age = float(podaci['age'])
        bp = float(podaci['bp'])
        bgr = float(podaci['bgr'])
        bu = float(podaci['bu'])
        sc = float(podaci['sc'])
        hemo = float(podaci['hemo'])
        pcv = float(podaci['pcv'])
        sg = float(podaci['sg'])
        al = float(podaci['al'])
        htn = podaci['htn']
        dm = podaci['dm']
        appet = podaci['appet']

        predikcija, vjerovatnoce = predvidi(age, bp, bgr, bu, sc, hemo, pcv, sg, al, htn, dm, appet, algorithm)
        klasifikacija = "ckd" if predikcija == 1 else "notckd"

        dataset_path = "data/ckd_cleaned_imputed.csv"
        novi_red = {
            'age': age,
            'bp': bp,
            'bgr': bgr,
            'bu': bu,
            'sc': sc,
            'hemo': hemo,
            'pcv': pcv,
            'sg': sg,
            'al': al,
            'htn': htn,
            'dm': dm,
            'appet': appet,
            'classification': klasifikacija
        }

        try:
            podaci_df = pd.read_csv(dataset_path)
        except FileNotFoundError:
            podaci_df = pd.DataFrame(columns=list(novi_red.keys()))

        podaci_df = pd.concat([podaci_df, pd.DataFrame([novi_red])], ignore_index=True)
        podaci_df.to_csv(dataset_path, index=False)

        return jsonify({
            "Predikcija": (
                "Pacijent ima visok rizik od bubrežne bolesti"
                if predikcija == 1 else
                "Pacijent nema visok rizik od bubrežne bolesti"
            ),
            "vjerovatnoce": {
                "Visok rizik": f"{vjerovatnoce[1] * 100:.2f}%",
                "Nizak rizik": f"{vjerovatnoce[0] * 100:.2f}%"
            }
        })
    except Exception as e:
        return jsonify({"error":str(e)}),500

# Endpoint za ponovno treniranje
@app.route('/admin-only', methods=['GET'])
@login_required
def admin_only_area():
    return jsonify({'message': 'Samo za admina!'})

@app.route('/retrain', methods=['POST'])
def retrain():
    try:
        req = request.json or {}
        algorithm = req.get('algorithm', 'RandomForest')
        hyperparams = req.get('hyperparams', {})

        dataset_path = "data/ckd_cleaned_imputed.csv"
        podaci = ucitaj_podatke(dataset_path)
        X_train, X_test, y_train, y_test = pripremi_podatke(podaci)

        model = treniraj_model(algorithm, hyperparams, X_train, y_train)

        y_pred_train = model.predict(X_train)
        y_pred_test = model.predict(X_test)
        evaluiraj_model(y_train, y_pred_train, algorithm, dataset="Trening")
        evaluiraj_model(y_test, y_pred_test, algorithm, dataset="Test")

        train_report = classification_report(y_train, y_pred_train, output_dict=True)
        test_report = classification_report(y_test, y_pred_test, output_dict=True)

        filename_map = {
        "RandomForest": "model/kidney_disease_model.joblib",
        "LogisticRegression": "model/kidney_disease_lr.joblib",
        "KNearestNeighbors": "model/kidney_disease_knn.joblib",
        "SupportVectorMachines": "model/kidney_disease_svm.joblib"
        }

        filename = filename_map.get(algorithm, "model/kidney_disease_model.joblib")
        dump(model, filename)

        return jsonify({
            "message": f"Model {algorithm} uspješno treniran i spremljen.",
            "metrics": {
                "train": train_report,
                "test": test_report
            }
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    import os
    model_path = "model/kidney_disease_model.joblib"
    if not os.path.exists(model_path):
        print("Treniranje modela...")
        podaci = ucitaj_podatke()
        X_train, X_test, y_train, y_test = pripremi_podatke(podaci)
        # Treniraj model sa default parametrima
        model = treniraj_model("RandomForest", {}, X_train, y_train)
        dump(model, model_path)
        print("Model je treniran i spremljen.")
    else:
        print("Model već postoji.")
    app.run(debug=True)
