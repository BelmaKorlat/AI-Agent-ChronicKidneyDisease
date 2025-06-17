// Prebacivanje prikaza forme
document.addEventListener('DOMContentLoaded', function () {

    // Prikaz/skrivanje forme registracije/login
    document.getElementById('show-register').onclick = function (e) {
        e.preventDefault();
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('register-form').style.display = 'block';
        document.getElementById('auth-message').innerText = '';
    };

    document.getElementById('show-login').onclick = function (e) {
        e.preventDefault();
        document.getElementById('register-form').style.display = 'none';
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('auth-message').innerText = '';
    };

    function showLoginButton() {
        document.getElementById('login-btn').style.display = 'inline-block';
        document.getElementById('logout-panel').style.display = 'none';
    }
    function showLogoutPanel(username) {
        document.getElementById('login-btn').style.display = 'none';
        document.getElementById('logout-panel').style.display = 'flex';
        document.getElementById('welcome-user').innerText = `Dobro došli, ${username}!`;
    }
    function isLoggedIn() {
        return !!localStorage.getItem('admin_token');
    }
    function getLoggedUser() {
        return localStorage.getItem('admin_username') || '';
    }
    function checkLoginStateOnLoad() {
        if (isLoggedIn()) {
            showLogoutPanel(getLoggedUser());
            toggleAdminSections(true); // ovo već koristiš
        } else {
            showLoginButton();
            toggleAdminSections(false);
        }
    }
    document.addEventListener('DOMContentLoaded', checkLoginStateOnLoad);
    // Klik na "Prijavi se"
    document.getElementById('login-btn').addEventListener('click', function () {
        document.getElementById('auth-section').style.display = 'block';
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('register-form').style.display = 'none';
        document.getElementById('auth-message').innerText = '';
    });

    // Klik na "Odjavi se"
    document.getElementById('logout-btn').addEventListener('click', function () {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_username');
        showLoginButton();
        toggleAdminSections(false);
        // Resetuj i adminToggle (ako ga imaš)
        document.getElementById('adminToggle').checked = false;
        document.getElementById('adminLabel').innerText = "Admin prikaz";
    });


    // Registracija - provjera potvrde lozinke
    document.getElementById('register-form').addEventListener('submit', async function (e) {
        e.preventDefault();
        const first_name = document.getElementById('reg-ime').value;
        const last_name = document.getElementById('reg-prezime').value;
        const username = document.getElementById('reg-username').value;
        const password = document.getElementById('reg-password').value;
        const confirm = document.getElementById('reg-password-confirm').value;

        if (password !== confirm) {
            document.getElementById('auth-message').innerText = "Lozinke se ne poklapaju!";
            return;
        }

        const res = await fetch('http://127.0.0.1:5000/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ first_name, last_name, username, password })
        });
        const data = await res.json();
        document.getElementById('auth-message').innerText = data.message || data.error;

        if (data.message) {
            document.getElementById('reg-ime').value = '';
            document.getElementById('reg-prezime').value = '';
            document.getElementById('reg-username').value = '';
            document.getElementById('reg-password').value = '';
            document.getElementById('reg-password-confirm').value = '';
            setTimeout(() => {
                document.getElementById('register-form').style.display = 'none';
                document.getElementById('login-form').style.display = 'block';
                document.getElementById('auth-message').innerText = '';
            }, 1200);
        }
    });

    // Login
    document.getElementById('login-form').addEventListener('submit', async function (e) {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        const res = await fetch('http://127.0.0.1:5000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.token) {
            localStorage.setItem('admin_token', data.token);
            localStorage.setItem('admin_username', data.username);   // <- OVA LINIJA
            document.getElementById('auth-message').innerText = "Uspješna prijava!";
            toggleAdminSections(true);
            document.getElementById('auth-section').style.display = 'none';

            showLogoutPanel(data.username);     // <- OVA LINIJA
            document.getElementById('adminLabel').innerText = "Odjavite se";
            document.getElementById('adminToggle').checked = true;

            document.getElementById('login-username').value = '';
            document.getElementById('login-password').value = '';

            setTimeout(() => {
                document.getElementById('auth-message').innerText = '';
            }, 1000);
        } else {
            document.getElementById('auth-message').innerText = data.error || 'Greška pri prijavi!';
        }
    });

    // Prikazi/sakrij auth-section/toggle label (SAMO JEDNOM event listener)
    document.getElementById('adminToggle').addEventListener('change', function () {
        if (!this.checked) {
            document.getElementById('auth-section').style.display = 'none';
            document.getElementById('adminLabel').innerText = "Admin prikaz";
            localStorage.removeItem('admin_token');
            toggleAdminSections(false);
        } else {
            if (!localStorage.getItem('admin_token')) {
                document.getElementById('auth-section').style.display = 'block';
                document.getElementById('adminLabel').innerText = "Admin prikaz";
            } else {
                document.getElementById('adminLabel').innerText = "Odjavite se";
            }
        }
    });

    // Helper: Prikaz/Sakrivanje admin sekcija
    function toggleAdminSections(isAdmin) {
        document.querySelectorAll('.admin-section').forEach(el => {
            el.style.display = isAdmin ? 'block' : 'none';
        });
    }
});

document.getElementById('prediction-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    document.getElementById('result').style.display = 'none';
    document.getElementById('result').innerHTML = '';
    document.querySelectorAll('.text-danger').forEach((error) => (error.textContent = ''));
    document.querySelectorAll('.input-error').forEach((input) => input.classList.remove('input-error'));


    const age = document.getElementById('age').value;
    const bp = document.getElementById('bp').value;
    const bgr = document.getElementById('bgr').value;
    const bu = document.getElementById('bu').value;
    const sc = document.getElementById('sc').value;
    const hemo = document.getElementById('hemo').value;
    const pcv = document.getElementById('pcv').value;
    const sg = document.getElementById('sg').value;
    const al = document.getElementById('al').value;
    const htn = document.getElementById('htn').value;
    const dm = document.getElementById('dm').value;
    const appet = document.getElementById('appet').value;

    let valid = true;
    const showError = (id, message) => {
        document.getElementById(id).textContent = message;
        const inputField = document.getElementById(id.replace('Error', ''));
        inputField.classList.add('input-error');
    };

    const removeError = (id) => {
        const errorElement = document.getElementById(id);
        if (errorElement) {
            errorElement.textContent = '';
        }
        const inputField = document.getElementById(id.replace('Error', ''));
        if (inputField) {
            inputField.classList.remove('input-error');
        }
    };

    document.querySelectorAll('.text-danger').forEach(error => {
        const id = error.id;
        removeError(id);
    });

    if (!age || age < 1 || age > 101) {
        showError('ageError', 'Starost mora biti između 1 i 100 godina.');
        valid = false;
    }
    if (!bp || bp < 60 || bp > 200) {
        showError('bpError', 'Krvni pritisak mora biti između 60 i 200 mmHg.');
        valid = false;
    }
    if (!bgr || bgr < 50 || bgr > 500) {
        showError('bgrError', 'Nivo glukoze u krvi mora biti između 50 i 500 mg/dL.');
        valid = false;
    }
    if (!bu || bu < 1 || bu > 200) {
        showError('buError', 'Urea u krvi mora biti između 1 i 200 mg/dL.');
        valid = false;
    }
    if (!sc || sc < 0.1 || sc > 20) {
        showError('scError', 'Kreatinin u serumu mora biti između 0.1 i 20 mg/dL.');
        valid = false;
    }
    if (!hemo || hemo < 3 || hemo > 25) {
        showError('hemoError', 'Hemoglobin mora biti između 3 i 25 g/dL.');
        valid = false;
    }
    if (!pcv || pcv < 10 || pcv > 54) {
        showError('pcvError', 'Hematokrit mora biti između 10 i 54%.');
        valid = false;
    }
    if (!sg || sg < 1.000 || sg > 1.050) {
        showError('sgError', 'Specifična težina mora biti između 1.000 i 1.050.');
        valid = false;
    }
    if (!al || al < 0 || al > 10) {
        showError('alError', 'Albumin mora biti između 0 i 10 g/dL.');
        valid = false;
    }
    if (!htn) {
        showError('htnError', 'Odaberite stanje hipertenzije.');
        valid = false;
    }
    if (!dm) {
        showError('dmError', 'Odaberite stanje dijabetesa.');
        valid = false;
    }
    if (!appet) {
        showError('appetError', 'Odaberite stanje apetita.');
        valid = false;
    }

    if (!valid) return;

    document.getElementById('result').style.display = 'none';
    const algorithm = document.getElementById('prediction-algorithm').value;

    try {
        const response = await fetch('http://127.0.0.1:5000/predvidi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                age, bp, bgr, bu, sc, hemo, pcv, sg, al, htn, dm, appet, algorithm
            })

        });

        if (response.ok) {
            const result = await response.json();
            const highRisk = parseFloat(result.vjerovatnoce["Visok rizik"]);
            const lowRisk = parseFloat(result.vjerovatnoce["Nizak rizik"]);
            const isHighRisk = highRisk > 50;

            document.getElementById('result').innerHTML = `
                <div class="alert alert-light">
                    <h4 class="alert-heading text-center ${isHighRisk ? 'text-danger' : 'text-success'}">
                        <i class="bi ${isHighRisk ? 'bi-exclamation-circle' : 'bi-check-circle'}"></i>
                        ${result.Predikcija}
                    </h4>
                    <p>${isHighRisk ? "Rezultat ukazuje na hroničnu bubrežnu bolest. Preporučuje se konsultacija s nefrologom." : "Rezultat ne ukazuje na visok rizik, ali redovni medicinski pregledi su preporučljivi."}</p>
                    <hr>
                    <p><strong><i class="bi bi-exclamation-triangle-fill text-danger"></i> Visok rizik:</strong> ${highRisk.toFixed(2)}%</p>
                    <div class="progress custom-progress-bar progress-bar-striped my-2">
                        <div class="progress-bar bg-danger" role="progressbar" style="width: ${highRisk}%; animation: fillProgress 2s ease-in-out;" aria-valuenow="${highRisk}" aria-valuemin="0" aria-valuemax="100">${highRisk.toFixed(2)}%</div>
                    </div>
                    <p><strong><i class="bi bi-check-circle-fill text-success"></i> Nizak rizik:</strong> ${lowRisk.toFixed(2)}%</p>
                    <div class="progress custom-progress-bar progress-bar-striped my-2">
                        <div class="progress-bar bg-success" role="progressbar" style="width: ${lowRisk}%; animation: fillProgress 2s ease-in-out;" aria-valuenow="${lowRisk}" aria-valuemin="0" aria-valuemax="100">${lowRisk.toFixed(2)}%</div>
                    </div>
                </div>
            `;

            // Prikaz buttona za e-mail
            document.getElementById('pdf-export-wrapper').style.display = 'block';

            let emailBodyText =
                `Poštovani,

                Vaši rezultati su sljedeći:

                -------------------------------------
                PODACI IZ FORME:
                -------------------------------------
                Starost: ${age}
                Krvni pritisak: ${bp}
                Nivo glukoze u krvi: ${bgr}
                Urea u krvi: ${bu}
                Kreatinin u serumu: ${sc}
                Hemoglobin: ${hemo}
                Hematokrit: ${pcv}
                Specifična težina urina: ${sg}
                Albumin: ${al}
                Hipertenzija: ${htn === 'yes' ? 'Da' : 'Ne'}
                Dijabetes: ${dm === 'yes' ? 'Da' : 'Ne'}
                Apetit: ${appet === 'good' ? 'Dobar' : 'Loš'}

                -------------------------------------
                REZULTAT PREDIKCIJE:
                -------------------------------------
                Rezultat: ${result.Predikcija}
                Visok rizik: ${highRisk.toFixed(2)}%
                Nizak rizik: ${lowRisk.toFixed(2)}%

                Napomena: Ovi rezultati su informativnog karaktera.
                Za tačnu dijagnozu obratite se ljekaru.

                Srdačan pozdrav,
                Vaša aplikacija za predikciju bubrežne bolesti
            `;

            const mailSubject = encodeURIComponent("Rezultati predikcije bubrežne bolesti");
            const gmailLink = `https://mail.google.com/mail/?view=cm&fs=1&su=${mailSubject}&body=${encodeURIComponent(emailBodyText)}`;
            document.getElementById('email-link').setAttribute('href', gmailLink);
            document.getElementById('email-link').setAttribute('target', '_blank');
        } else {
            const error = await response.json();
            document.getElementById('result').innerHTML = `
                <div class="alert alert-danger">
                    <strong>Greška:</strong> ${error.error}
                </div>
            `;
        }
    } catch (error) {
        document.getElementById('result').innerHTML = `
            <div class="alert alert-danger">
                <strong>Došlo je do greške:</strong> ${error.message}
            </div>
        `;
    } finally {
        document.getElementById('result').style.display = 'block';
    }
});

// Funkcija za resetovanje forme
document.getElementById('prediction-form').addEventListener('reset', () => {
    document.querySelectorAll('.text-danger').forEach((error) => (error.textContent = ''));
    document.querySelectorAll('.is-invalid').forEach((input) => input.classList.remove('is-invalid'));
    document.getElementById('result').style.display = 'none';
});

const hyperparamsConfig = {
    RandomForest: [
        { id: 'n_estimators', label: 'Broj stabala', type: 'number', value: 100, min: 1, max: 500 },
        { id: 'max_depth', label: 'Maksimalna dubina', type: 'number', value: 10, min: 1, max: 50 },
    ],
    LogisticRegression: [
        { id: 'C', label: 'Regularizacija (C)', type: 'number', value: 1.0, step: 0.01, min: 0.01, max: 10 },
        { id: 'max_iter', label: 'Maksimalan broj iteracija', type: 'number', value: 1000, min: 100, max: 10000 },
    ],
    KNearestNeighbors: [
        { id: 'n_neighbors', label: 'Broj susjeda (k)', type: 'number', value: 5, min: 1, max: 30 },
    ],
    SupportVectorMachines: [
        { id: 'C', label: 'Regularizacija (C)', type: 'number', value: 1.0, step: 0.01, min: 0.01, max: 10 },
        { id: 'kernel', label: 'Kernel', type: 'select', options: ['rbf', 'linear', 'poly', 'sigmoid'] },
    ],
};

function showHyperparamsFields(algorithm) {
    const section = document.getElementById('hyperparams-section');
    section.innerHTML = '';
    const params = hyperparamsConfig[algorithm];
    if (!params) return;
    params.forEach(param => {
        let inputHTML = '';
        if (param.type === 'select') {
            inputHTML = `
                <label for="${param.id}" class="form-label">${param.label}:</label>
                <select id="${param.id}" class="form-select mb-2">
                    ${param.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                </select>
            `;
        } else {
            inputHTML = `
                <label for="${param.id}" class="form-label">${param.label}:</label>
                <input type="${param.type}" id="${param.id}" class="form-control mb-2"
                       value="${param.value}" min="${param.min ?? ''}" max="${param.max ?? ''}" ${param.step ? `step="${param.step}"` : ''}>
            `;
        }
        section.innerHTML += `<div class="mb-2">${inputHTML}</div>`;
    });
}

// Prvi prikaz na učitavanju:
document.addEventListener('DOMContentLoaded', () => {
    showHyperparamsFields('RandomForest');
});

// Kod promjene algoritma
document.getElementById('ml-algorithm').addEventListener('change', function () {
    showHyperparamsFields(this.value);
});

let sviRezultati = [];

function dodajRezultatUTablicu(nazivModela, metrics) {
    const ckd = metrics['1'] || metrics['ckd'] || {};
    const notckd = metrics['0'] || metrics['notckd'] || {};

    const accuracy = typeof metrics['accuracy'] === "number" ? (metrics['accuracy']).toFixed(2) : "";

    sviRezultati.push({
        model: nazivModela,
        accuracy: accuracy,
        precision_ckd: typeof ckd.precision === "number" ? (ckd.precision).toFixed(2) : "",
        recall_ckd: typeof ckd.recall === "number" ? (ckd.recall).toFixed(2) : "",
        f1_ckd: typeof ckd['f1-score'] === "number" ? (ckd['f1-score']).toFixed(2) : "",
        precision_notckd: typeof notckd.precision === "number" ? (notckd.precision).toFixed(2) : "",
        recall_notckd: typeof notckd.recall === "number" ? (notckd.recall).toFixed(2) : "",
        f1_notckd: typeof notckd['f1-score'] === "number" ? (notckd['f1-score']).toFixed(2) : ""
    });
    // Prikaz svih rezultata u tablici
    const section = document.getElementById('results-table-section');
    const tbody = document.getElementById('results-table').querySelector('tbody');
    section.style.display = sviRezultati.length ? 'block' : 'none';

    tbody.innerHTML = sviRezultati.map(rez => `
        <tr>
            <td>${rez.model}</td>
            <td>${rez.accuracy}</td>
            <td>${rez.precision_ckd}</td>
            <td>${rez.recall_ckd}</td>
            <td>${rez.f1_ckd}</td>
            <td>${rez.precision_notckd}</td>
            <td>${rez.recall_notckd}</td>
            <td>${rez.f1_notckd}</td>
        </tr>
    `).join('');

    document.getElementById('export-csv-btn').style.display = sviRezultati.length ? 'inline-block' : 'none';
    prikaziIliUpdateBarChart(currentMetric);
}

function exportToCSV() {
    if (!sviRezultati.length) return;

    // Zaglavlje CSV-a
    const header = [
        "Model", "Accuracy",
        "Precision (ckd)", "Recall (ckd)", "F1 (ckd)",
        "Precision (notckd)", "Recall (notckd)", "F1 (notckd)"
    ];
    const rows = sviRezultati.map(rez => [
        rez.model,
        rez.accuracy,
        rez.precision_ckd,
        rez.recall_ckd,
        rez.f1_ckd,
        rez.precision_notckd,
        rez.recall_notckd,
        rez.f1_notckd
    ]);

    // Kreiranje CSV stringa
    let csvContent = header.join(",") + "\n";
    rows.forEach(row => {
        csvContent += row.join(",") + "\n";
    });

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'rezultati_modela.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

document.getElementById('export-csv-btn').addEventListener('click', exportToCSV);

function updateFileName() {
    var fileInput = document.getElementById('import-csv-btn');
    var fileName = document.getElementById('fileName');
    if (fileInput.files.length > 0) {
        fileName.textContent = fileInput.files[0].name;
    } else {
        fileName.textContent = '';
    }
}

document.getElementById('import-csv-btn').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (event) {
        const text = event.target.result;
        const rows = text.trim().split('\n');
        if (rows.length < 2) return;

        const headers = rows[0].split(',');
        sviRezultati = [];

        for (let i = 1; i < rows.length; i++) {
            const cols = rows[i].split(',');
            if (cols.length !== headers.length) continue;
            sviRezultati.push({
                model: cols[0],
                accuracy: cols[1],
                precision_ckd: cols[2],
                recall_ckd: cols[3],
                f1_ckd: cols[4],
                precision_notckd: cols[5],
                recall_notckd: cols[6],
                f1_notckd: cols[7]
            });
        }

        const section = document.getElementById('results-table-section');
        const tbody = document.getElementById('results-table').querySelector('tbody');
        section.style.display = sviRezultati.length ? 'block' : 'none';

        tbody.innerHTML = sviRezultati.map(rez => `
            <tr>
                <td>${rez.model}</td>
                <td>${rez.accuracy}</td>
                <td>${rez.precision_ckd}</td>
                <td>${rez.recall_ckd}</td>
                <td>${rez.f1_ckd}</td>
                <td>${rez.precision_notckd}</td>
                <td>${rez.recall_notckd}</td>
                <td>${rez.f1_notckd}</td>
            </tr>
        `).join('');
    };
    reader.readAsText(file);
    prikaziIliUpdateBarChart(currentMetric);
});

document.getElementById('retrain-button').addEventListener('click', async (e) => {
    e.preventDefault();
    const algorithm = document.getElementById('ml-algorithm').value;

    const params = {};
    Array.from(document.querySelectorAll('#hyperparams-section input, #hyperparams-section select')).forEach(input => {
        params[input.id] = input.value;
    });
    try {
        const response = await fetch('http://127.0.0.1:5000/retrain', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ algorithm, hyperparams: params })
        });

        if (response.ok) {
            const result = await response.json();
            alert(result.message || 'Treniranje završeno!');

            if (result.metrics) {
                dodajRezultatUTablicu(algorithm, result.metrics.test);
            }
        }
        else {
            const error = await response.json();
            alert(`Greška: ${error.error}`);
        }
    } catch (error) {
        alert(`Došlo je do greške: ${error.message}`);
    }
});

// Funkcija za prikaz metrika iz Python classification_report output_dict
function prikaziMetrike(report) {
    let klasaNazivi = { "0": "notckd", "1": "ckd" };
    let html = `<table class="table table-bordered"><thead><tr>
        <th></th><th>Precision</th><th>Recall</th><th>F1</th><th>Support</th></tr></thead><tbody>`;
    for (let kljuc in report) {
        if (typeof report[kljuc] !== 'object') continue;
        let naziv = klasaNazivi[kljuc] || kljuc;
        html += `<tr><td>${naziv}</td>
            <td>${(report[kljuc].precision ?? '').toFixed(2)}</td>
            <td>${(report[kljuc].recall ?? '').toFixed(2)}</td>
            <td>${(report[kljuc]['f1-score'] ?? '').toFixed(2)}</td>
            <td>${report[kljuc].support ?? ''}</td></tr>`;
    }
    html += `</tbody></table>`;
    if (report.accuracy !== undefined) {
        html += `<div class="fw-bold">Accuracy: ${(report.accuracy * 100).toFixed(2)}%</div>`;
    }
    return html;
}

document.addEventListener('DOMContentLoaded', () => {
    let resultChartInstance;

    const createResultChart = (highRisk, lowRisk) => {
        const ctx = document.getElementById('resultChart').getContext('2d');

        // Uništavanje prethodnog grafa ako postoji
        if (resultChartInstance) {
            resultChartInstance.destroy();
        }

        // Kreiranje novog grafa
        resultChartInstance = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Visok rizik', 'Nizak rizik'],
                datasets: [{
                    data: [highRisk, lowRisk],
                    backgroundColor: ['rgba(255, 99, 132, 0.5)', 'rgba(75, 192, 192, 0.5)'], // Boje za segment
                    borderColor: ['rgba(255, 99, 132, 1)', 'rgba(75, 192, 192, 1)'], // Ivica segmenta
                    borderWidth: 1
                }]
            },
            options: {
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom'
                    }
                }
            }
        });
    };

    // Kreiranje grafa kada se otvori modal
    const resultChartModal = document.getElementById('resultChartModal');
    resultChartModal.addEventListener('show.bs.modal', () => {
        // Preuzimanje vrijednosti iz rezultata
        const highRisk = parseFloat(document.querySelector('.progress-bar.bg-danger').getAttribute('aria-valuenow')) || 0;
        const lowRisk = parseFloat(document.querySelector('.progress-bar.bg-success').getAttribute('aria-valuenow')) || 0;

        // Kreiranje grafa s novim vrijednostima
        createResultChart(highRisk, lowRisk);
    });
});

// Graf za usporedbu rezultata treniranih modela
let currentMetric = 'accuracy';
let barChart = null;

function getBarChartData(metric) {
    return {
        labels: sviRezultati.map(r => r.model),
        datasets: [{
            data: sviRezultati.map(r => Number(r[metric])),
            backgroundColor: [
                'rgba(54, 162, 235, 0.6)',
                'rgba(255, 99, 132, 0.6)',
                'rgba(255, 206, 86, 0.6)',
                'rgba(75, 192, 192, 0.6)'
            ],
            borderColor: [
                'rgba(54, 162, 235, 1)',
                'rgba(255, 99, 132, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)'
            ],
            borderWidth: 1,
            borderRadius: 8
        }]
    };
}

// Graf za usporedbu rezultata treniranih modela
function prikaziIliUpdateBarChart(metric = currentMetric) {
    const ctx = document.getElementById('dynamicBarChart').getContext('2d');
    const data = getBarChartData(metric);

    if (!barChart) {
        barChart = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: {
                indexAxis: 'y',
                responsive: true,
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: 'Rezultati modela po metrici'
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return context.label + ': ' + context.raw.toFixed(2);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        min: 0,
                        max: 1,
                        ticks: {
                            callback: v => v.toFixed(2)
                        }
                    }
                }
            }

        });
    } else {
        barChart.data = data;
        barChart.options.plugins.title.text = 'Rezultati modela: ' + document.querySelector(`[data-metric="${metric}"]`).innerText;
        barChart.update();
    }
}

document.getElementById('metric-buttons').addEventListener('click', function (e) {
    if (e.target.tagName === 'BUTTON') {
        const metric = e.target.getAttribute('data-metric');
        if (metric && sviRezultati.length > 0 && sviRezultati[0][metric] !== undefined) {
            currentMetric = metric;
            prikaziIliUpdateBarChart(metric);
        }
    }
});

document.getElementById('download-pdf-btn').addEventListener('click', function () {
    const pdfDiv = document.getElementById('pdf-clean-result');

    // Napravi čist sadržaj za PDF
    const age = document.getElementById('age').value;
    const bp = document.getElementById('bp').value;
    const bgr = document.getElementById('bgr').value;
    const bu = document.getElementById('bu').value;
    const sc = document.getElementById('sc').value;
    const hemo = document.getElementById('hemo').value;
    const pcv = document.getElementById('pcv').value;
    const sg = document.getElementById('sg').value;
    const al = document.getElementById('al').value;
    const htn = document.getElementById('htn').value === "yes" ? "Da" : "Ne";
    const dm = document.getElementById('dm').value === "yes" ? "Da" : "Ne";
    const appet = document.getElementById('appet').value === "good" ? "Dobar" : "Loš";
    const resultText = document.getElementById('result').innerText || '';

    pdfDiv.innerHTML = `
        <h2 style="text-align:center; margin-bottom: 16px;">Rezultati analize bubrežne bolesti</h2>
        <div style="margin-bottom: 24px; font-size:16px;">
            <strong>Rezultat:</strong><br>
            ${resultText.replace(/\n/g, '<br>')}
        </div>
        <hr>
        <div>
            <strong>Podaci iz forme:</strong>
            <ul style="font-size:15px;">
                <li><b>Starost:</b> ${age}</li>
                <li><b>Krvni pritisak:</b> ${bp}</li>
                <li><b>Nivo glukoze u krvi:</b> ${bgr}</li>
                <li><b>Urea u krvi:</b> ${bu}</li>
                <li><b>Kreatinin u serumu:</b> ${sc}</li>
                <li><b>Hemoglobin:</b> ${hemo}</li>
                <li><b>Hematokrit:</b> ${pcv}</li>
                <li><b>Specifična težina urina:</b> ${sg}</li>
                <li><b>Albumin:</b> ${al}</li>
                <li><b>Hipertenzija:</b> ${htn}</li>
                <li><b>Dijabetes:</b> ${dm}</li>
                <li><b>Apetit:</b> ${appet}</li>
            </ul>
        </div>
        <div style="margin-top: 16px; font-size:12px; color:gray;">
            <i>Ovi rezultati su informativnog karaktera. Za tačnu dijagnozu obratite se ljekaru.</i>
        </div>
    `;

    // 1. Pokaži div
    pdfDiv.style.display = 'block';

    // 2. Sačekaj 150ms da DOM renderuje novi sadržaj
    setTimeout(() => {
        // 3. Generiši PDF
        html2pdf().from(pdfDiv).save().then(() => {
            // 4. Sakrij div opet nakon spremanja
            pdfDiv.style.display = 'none';
        });
    }, 150);
});











